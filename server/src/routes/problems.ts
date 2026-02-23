import { Router } from 'express'
import Problem from '../models/Problem'
import { authRequired } from '../middleware/auth'

const router = Router()

router.post('/', authRequired, async (req, res) => {
	const p = await Problem.create(req.body)
	res.json(p)
})

router.get('/', async (_req, res) => {
	try {
		const ps = await Problem.find().sort({ _id: -1 })
		res.json(ps)
	} catch (err) {
		console.error('Error fetching problems:', err)
		res.status(500).json({ detail: 'Failed to fetch problems', error: err.message })
	}
})

router.get('/:id', async (req, res) => {
	const p = await Problem.findById(req.params.id)
	if (!p) return res.status(404).json({ detail: 'Problem not found' })
	res.json(p)
})

router.delete('/:id', authRequired, async (req, res) => {
	const p = await Problem.findById(req.params.id)
	if (!p) return res.status(404).json({ detail: 'Problem not found' })
	await p.deleteOne()
	res.json({ ok: true })
})

export default router







