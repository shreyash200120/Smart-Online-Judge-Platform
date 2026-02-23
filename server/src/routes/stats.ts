import { Router } from 'express'
import Submission from '../models/Submission'
import User from '../models/User'
import Problem from '../models/Problem'

const router = Router()

router.get('/leaderboard', async (_req, res) => {
	const rows = await Submission.aggregate([
		{ $match: { verdict: 'AC' } },
		{ $group: { _id: '$userId', accepted: { $sum: 1 } } },
		{ $sort: { accepted: -1 } },
		{ $limit: Number(process.env.LEADERBOARD_LIMIT || 20) },
		{ $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
		{ $unwind: '$user' },
		{ $project: { username: '$user.username', accepted: 1, _id: 0 } }
	])
	res.json(rows)
})

router.get('/problems', async (_req, res) => {
	const totals = await Submission.aggregate([
		{ $group: { _id: '$problemId', total: { $sum: 1 } } }
	])
	const acs = await Submission.aggregate([
		{ $match: { verdict: 'AC' } },
		{ $group: { _id: '$problemId', accepted: { $sum: 1 } } }
	])
	const tmap = new Map(totals.map((r:any)=> [String(r._id), r.total]))
	const amap = new Map(acs.map((r:any)=> [String(r._id), r.accepted]))
	const problems = await Problem.find()
	res.json(problems.map(p=> ({ problem_id: p._id, title: p.title, total: tmap.get(String(p._id))||0, accepted: amap.get(String(p._id))||0 })))
})

router.get('/users/:username', async (req, res) => {
	const user = await User.findOne({ username: req.params.username })
	if (!user) return res.json({ username: req.params.username, total: 0, accepted: 0 })
	const [total, ac] = await Promise.all([
		Submission.countDocuments({ userId: user._id }),
		Submission.countDocuments({ userId: user._id, verdict: 'AC' })
	])
	res.json({ username: user.username, total, accepted: ac })
})

// Get similarity stats for all problems
router.get('/problems/similarity', async (_req, res) => {
	const stats = await Submission.aggregate([
		{ $match: { similarityScore: { $exists: true } } },
		{ $group: { 
			_id: '$problemId',
			avgSimilarity: { $avg: '$similarityScore' },
			maxSimilarity: { $max: '$similarityScore' },
			submissionCount: { $sum: 1 }
		}},
		{ $lookup: { 
			from: 'problems', 
			localField: '_id', 
			foreignField: '_id', 
			as: 'problem'
		}},
		{ $unwind: '$problem' },
		{ $project: {
			problemId: '$_id',
			title: '$problem.title',
			avgSimilarity: { $round: ['$avgSimilarity', 2] },
			maxSimilarity: { $round: ['$maxSimilarity', 2] },
			submissionCount: 1,
			_id: 0
		}}
	])
	res.json(stats)
})

// Get bug report stats
router.get('/problems/bugs', async (_req, res) => {
	const stats = await Submission.aggregate([
		{ $match: { 'bugReport.type': { $exists: true } } },
		{ $group: {
			_id: { problemId: '$problemId', bugType: '$bugReport.type' },
			count: { $sum: 1 }
		}},
		{ $group: {
			_id: '$_id.problemId',
			bugCounts: {
				$push: {
					type: '$_id.bugType',
					count: '$count'
				}
			},
			totalBugs: { $sum: '$count' }
		}},
		{ $lookup: {
			from: 'problems',
			localField: '_id',
			foreignField: '_id',
			as: 'problem'
		}},
		{ $unwind: '$problem' },
		{ $project: {
			problemId: '$_id',
			title: '$problem.title',
			bugCounts: 1,
			totalBugs: 1,
			_id: 0
		}}
	])
	res.json(stats)
})

export default router







