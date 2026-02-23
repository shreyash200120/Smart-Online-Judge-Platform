import 'dotenv/config'
import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import mongoose from 'mongoose'

// Define schemas directly in worker
const TestCaseSchema = new mongoose.Schema({
	inputData: { type: String, required: true },
	expectedOutput: { type: String, required: true },
	isHidden: { type: Boolean, default: true }
}, { _id: true })

const ProblemSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	inputFormat: { type: String },
	outputFormat: { type: String },
	timeLimitMs: { type: Number, default: 2000 },
	memoryLimitMb: { type: Number, default: 256 },
	testcases: { type: [TestCaseSchema], default: [] },
	createdAt: { type: Date, default: Date.now }
})

const SubmissionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
	language: { type: String, enum: ['cpp', 'java', 'python'], required: true },
	sourceCode: { type: String, required: true },
	verdict: { type: String, enum: ['AC','WA','TLE','RE','CE','PD','RJ'], default: 'PD', index: true },
	timeMs: { type: Number },
	memoryKb: { type: Number },
	stderr: { type: String },
	failedCaseId: { type: mongoose.Schema.Types.ObjectId },
	bugAnalysis: { type: String },
	similarityScore: { type: Number },
	similarSubmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
})

SubmissionSchema.pre('save', function(next) {
	(this as any).updatedAt = new Date()
	next()
})

const Submission = mongoose.model('Submission', SubmissionSchema)
const Problem = mongoose.model('Problem', ProblemSchema)
import { executeCode, compareOutput, generateDiff } from './executor'
import { analyzeBugs } from './bugAnalyzer'
import { checkSimilarity } from './plagiarismDetector'
import ExternalSolution from './models/ExternalSolution'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/oj'
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379/0'

interface TestResult {
	verdict: 'AC' | 'WA' | 'TLE' | 'RE' | 'CE'
	timeMs?: number
	memoryKb?: number
	stderr?: string
	failedCaseId?: mongoose.Types.ObjectId
}

async function runTestCase(
	language: 'cpp' | 'java' | 'python',
	sourceCode: string,
	testCase: any,
	timeLimitMs: number,
	memoryLimitMb: number
): Promise<TestResult> {
	try {
		const result = await executeCode(
			language,
			sourceCode,
			testCase.inputData,
			timeLimitMs,
			memoryLimitMb
		)

		// Handle compilation errors
		if (result.stderr?.includes('Compilation Error')) {
			return {
				verdict: 'CE',
				stderr: result.stderr,
				failedCaseId: testCase._id
			}
		}

		// Handle runtime errors
		if (result.code !== 0) {
			return {
				verdict: 'RE',
				timeMs: result.timeMs,
				memoryKb: result.memoryKb,
				stderr: result.stderr,
				failedCaseId: testCase._id
			}
		}

		// Check memory limit
		if (result.memoryKb && result.memoryKb > memoryLimitMb * 1024) {
			return {
				verdict: 'RE',
				timeMs: result.timeMs,
				memoryKb: result.memoryKb,
				stderr: `Memory Limit Exceeded: Used ${Math.round(result.memoryKb/1024)}MB of ${memoryLimitMb}MB`,
				failedCaseId: testCase._id
			}
		}

		// Check time limit
		if (result.timeMs && result.timeMs > timeLimitMs) {
			return {
				verdict: 'TLE',
				timeMs: result.timeMs,
				memoryKb: result.memoryKb,
				stderr: `Time Limit Exceeded: ${result.timeMs}ms > ${timeLimitMs}ms`,
				failedCaseId: testCase._id
			}
		}

		// Check output
		if (!compareOutput(testCase.expectedOutput, result.stdout)) {
			return {
				verdict: 'WA',
				timeMs: result.timeMs,
				memoryKb: result.memoryKb,
				stderr: generateDiff(testCase.expectedOutput, result.stdout),
				failedCaseId: testCase._id
			}
		}

		// All good!
		return {
			verdict: 'AC',
			timeMs: result.timeMs,
			memoryKb: result.memoryKb
		}
	} catch (error) {
		return {
			verdict: 'RE',
			stderr: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			failedCaseId: testCase._id
		}
	}
}

async function start() {
	await mongoose.connect(MONGO_URL)
	
	// Use a simpler Redis configuration that works with BullMQ
	const connection = new Redis(REDIS_URL, {
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
		lazyConnect: true,
		connectTimeout: 10000,
		commandTimeout: 5000
	})
	
	new Worker('judging', async job => {
		const { submissionId } = job.data as { submissionId: string }
		
		// Get submission
		const sub = await Submission.findById(submissionId)
		if (!sub) {
			console.error(`Submission ${submissionId} not found`)
			return
		}

		try {
			// Mark as running
			sub.verdict = 'RJ'
			await sub.save()

			// Get problem
			const problem = await Problem.findById(sub.problemId)
			if (!problem) {
				throw new Error(`Problem ${sub.problemId} not found`)
			}

			// Get limits
			const timeLimitMs = problem.timeLimitMs || Number(process.env.TIME_LIMIT_MS || 2000)
			const memoryLimitMb = problem.memoryLimitMb || Number(process.env.MEMORY_LIMIT_MB || 256)

			// Run all test cases
			let maxTimeMs = 0
			let maxMemoryKb = 0

			for (const testCase of problem.testcases) {
				const result = await runTestCase(
					sub.language as 'cpp' | 'java' | 'python',
					sub.sourceCode,
					testCase,
					timeLimitMs,
					memoryLimitMb
				)

				// Update max resource usage
				if (result.timeMs) maxTimeMs = Math.max(maxTimeMs, result.timeMs)
				if (result.memoryKb) maxMemoryKb = Math.max(maxMemoryKb, result.memoryKb)

				// If not AC, analyze and update submission
				if (result.verdict !== 'AC') {
					sub.verdict = result.verdict
					sub.timeMs = result.timeMs
					sub.memoryKb = result.memoryKb
					sub.stderr = result.stderr
					sub.failedCaseId = result.failedCaseId

					// If verdict is WA or RE, analyze for potential bugs
					if ((result.verdict === 'WA' || result.verdict === 'RE') && sub.language !== 'python') {
						// Skip python for now as its analysis needs different patterns
						const bugFindings = analyzeBugs(sub.sourceCode, sub.language)
						if (bugFindings.length > 0) {
							sub.bugAnalysis = bugFindings.join('\n\n')
						}
					}

					await sub.save()
					return
				}

				// For AC submissions, check for plagiarism
				let maxSimilarity = 0
				let similarSubmissionId = null

				// Check against previous AC submissions
				const previousSubmissions = await Submission.find({
					problemId: sub.problemId,
					verdict: 'AC',
					language: sub.language,
					_id: { $ne: sub._id }
				}).sort({ createdAt: -1 }).limit(10) // Check last 10 submissions

				for (const prevSub of previousSubmissions) {
					const { similarityScore } = checkSimilarity(
						sub.sourceCode,
						prevSub.sourceCode,
						sub.language as 'cpp' | 'java' | 'python'
					)
					if (similarityScore > maxSimilarity) {
						maxSimilarity = similarityScore
						similarSubmissionId = prevSub._id
					}
				}

				// Check against external solutions
				const externalSolutions = await ExternalSolution.find({
					problemId: sub.problemId,
					language: sub.language
				})

				for (const extSol of externalSolutions) {
					const { similarityScore } = checkSimilarity(
						sub.sourceCode,
						extSol.sourceCode,
						sub.language as 'cpp' | 'java' | 'python'
					)
					if (similarityScore > maxSimilarity) {
						maxSimilarity = similarityScore
						similarSubmissionId = extSol._id
					}
				}

				// Update submission with similarity data if significant similarity found
				if (maxSimilarity > 0.8) { // 80% similarity threshold
					sub.similarityScore = maxSimilarity
					sub.similarSubmissionId = similarSubmissionId
				}
			}

			// All test cases passed
			sub.verdict = 'AC'
			sub.timeMs = maxTimeMs
			sub.memoryKb = maxMemoryKb
			await sub.save()

		} catch (error: unknown) {
			console.error(`Error processing submission ${submissionId}:`, error)
			sub.verdict = 'RE'
			sub.stderr = `System error: ${error instanceof Error ? error.message : 'Unknown error'}`
			await sub.save()
		}
	}, {
		connection,
		concurrency: Number(process.env.WORKER_CONCURRENCY || 4)
	})
	console.log('Worker started')
}

start().catch(err => { console.error(err); process.exit(1) })

