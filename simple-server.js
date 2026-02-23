const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://onlinejudge-mongo-1:27017/oj');

// Schemas
const UserSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true },
	passwordHash: { type: String, required: true },
	createdAt: { type: Date, default: Date.now }
});

const TestCaseSchema = new mongoose.Schema({
	inputData: { type: String, required: true },
	expectedOutput: { type: String, required: true },
	isHidden: { type: Boolean, default: true }
}, { _id: true });

const ProblemSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	inputFormat: { type: String },
	outputFormat: { type: String },
	timeLimitMs: { type: Number, default: 2000 },
	memoryLimitMb: { type: Number, default: 256 },
	testcases: { type: [TestCaseSchema], default: [] },
	createdAt: { type: Date, default: Date.now }
});

const SubmissionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
	language: { type: String, enum: ['cpp', 'java'], required: true },
	sourceCode: { type: String, required: true },
	verdict: { type: String, enum: ['AC','WA','TLE','RE','PD','RJ'], default: 'PD', index: true },
	timeMs: { type: Number },
	memoryKb: { type: Number },
	stderr: { type: String },
	failedCaseId: { type: mongoose.Schema.Types.ObjectId },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Problem = mongoose.model('Problem', ProblemSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);

// Auth middleware
const auth = (req, res, next) => {
	const token = req.headers.authorization?.replace('Bearer ', '');
	if (!token) return res.status(401).json({ detail: 'Unauthorized' });
	try {
		const decoded = jwt.verify(token, 'change-me');
		req.user = decoded;
		next();
	} catch (err) {
		res.status(401).json({ detail: 'Invalid token' });
	}
};

// Routes
app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/auth/register', async (req, res) => {
	try {
		const { username, password } = req.body;
		const existing = await User.findOne({ username });
		if (existing) return res.status(400).json({ detail: 'Username already exists' });
		
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ username, passwordHash });
		res.json({ id: user._id, username: user.username, createdAt: user.createdAt });
	} catch (err) {
		res.status(500).json({ detail: 'Registration failed' });
	}
});

app.post('/auth/token', async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		if (!user) return res.status(400).json({ detail: 'Incorrect username or password' });
		
		const valid = await bcrypt.compare(password, user.passwordHash);
		if (!valid) return res.status(400).json({ detail: 'Incorrect username or password' });
		
		const token = jwt.sign({ sub: user._id, username: user.username }, 'change-me', { expiresIn: '1h' });
		res.json({ access_token: token, token_type: 'bearer' });
	} catch (err) {
		res.status(500).json({ detail: 'Login failed' });
	}
});

app.get('/problems', async (req, res) => {
	try {
		const problems = await Problem.find().sort({ _id: -1 });
		res.json(problems);
	} catch (err) {
		res.status(500).json({ detail: 'Failed to fetch problems' });
	}
});

app.get('/problems/:id', async (req, res) => {
	try {
		const problem = await Problem.findById(req.params.id);
		if (!problem) return res.status(404).json({ detail: 'Problem not found' });
		res.json(problem);
	} catch (err) {
		res.status(500).json({ detail: 'Failed to fetch problem' });
	}
});

app.post('/submissions', auth, async (req, res) => {
	try {
		const { problemId, language, sourceCode } = req.body;
		const problem = await Problem.findById(problemId);
		if (!problem) return res.status(404).json({ detail: 'Problem not found' });
		
		const submission = await Submission.create({
			userId: req.user.sub,
			problemId,
			language,
			sourceCode,
			verdict: 'PD'
		});
		
		res.json(submission);
	} catch (err) {
		res.status(500).json({ detail: 'Submission failed' });
	}
});

app.get('/submissions', auth, async (req, res) => {
	try {
		const submissions = await Submission.find({ userId: req.user.sub }).sort({ _id: -1 });
		res.json(submissions);
	} catch (err) {
		res.status(500).json({ detail: 'Failed to fetch submissions' });
	}
});

app.get('/submissions/:id', auth, async (req, res) => {
	try {
		const submission = await Submission.findOne({ _id: req.params.id, userId: req.user.sub });
		if (!submission) return res.status(404).json({ detail: 'Submission not found' });
		res.json(submission);
	} catch (err) {
		res.status(500).json({ detail: 'Failed to fetch submission' });
	}
});

app.get('/stats/leaderboard', async (req, res) => {
	try {
		const leaderboard = await Submission.aggregate([
			{ $match: { verdict: 'AC' } },
			{ $group: { _id: '$userId', accepted: { $sum: 1 } } },
			{ $sort: { accepted: -1 } },
			{ $limit: 20 },
			{ $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
			{ $unwind: '$user' },
			{ $project: { username: '$user.username', accepted: 1, _id: 0 } }
		]);
		res.json(leaderboard);
	} catch (err) {
		res.status(500).json({ detail: 'Failed to fetch leaderboard' });
	}
});

app.listen(3000, () => console.log('Simple server running on port 3000'));






