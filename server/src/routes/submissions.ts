import { Router, Response } from 'express'
import Submission from '../models/Submission'
import Problem from '../models/Problem'
import { authRequired, AuthedRequest } from '../middleware/auth'
import { enqueueSubmission } from '../queue'

const router = Router()

router.post('/', authRequired, async (req: AuthedRequest, res) => {
	const { problemId, language, sourceCode } = req.body || {}
	
	// Basic validation
	if (!sourceCode || typeof sourceCode !== 'string') {
		return res.status(400).json({ detail: 'Source code is required' })
	}
	
	const problem = await Problem.findById(problemId)
	if (!problem) return res.status(404).json({ detail: 'Problem not found' })
	if (!['cpp','java'].includes(language)) return res.status(400).json({ detail: 'Unsupported language' })

	// Parse and clean the code
	const { parseJavaCode, parseCppCode } = require('../utils/codeParser')
	const parsedCode = language === 'java' ? parseJavaCode(sourceCode) : parseCppCode(sourceCode)
	
	if (!parsedCode.isValid) {
		return res.status(400).json({ 
			detail: 'Invalid code structure',
			error: parsedCode.error
		})
	}
	
	// Create submission with initial "Pending" verdict and cleaned code
	const sub = await Submission.create({ 
		userId: req.user!.id, 
		problemId, 
		language, 
		sourceCode: parsedCode.codeBody, // Use the cleaned and formatted code
		verdict: 'PD' // Set to Pending for judge evaluation
	})

	// Queue submission for judging
	await enqueueSubmission(sub._id.toString())
	
	res.json(sub)
})

router.get('/', authRequired, async (req: AuthedRequest, res: Response) => {
	const subs = await Submission.find({ userId: req.user!.id })
		.populate('similarSubmissionId', 'userId createdAt language')
		.sort({ _id: -1 })
	res.json(subs)
})

router.get('/:id', authRequired, async (req: AuthedRequest, res: Response) => {
	const sub = await Submission.findOne({ _id: req.params.id, userId: req.user!.id })
		.populate('similarSubmissionId', 'userId createdAt language')
	if (!sub) return res.status(404).json({ detail: 'Submission not found' })
	res.json(sub)
})

export default router




