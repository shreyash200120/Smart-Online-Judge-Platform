import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const connection = new Redis(process.env.REDIS_URL || 'redis://redis:6379/0', {
	maxRetriesPerRequest: null,
	enableReadyCheck: false
})
export const judgeQueue = new Queue('judging', { connection })

export async function enqueueSubmission(submissionId: string) {
	await judgeQueue.add('judge', { submissionId })
}



