import mongoose, { Schema, InferSchemaType } from 'mongoose'

const SubmissionSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
	language: { type: String, enum: ['cpp', 'java', 'python'], required: true },
	sourceCode: { type: String, required: true },
	verdict: { type: String, enum: ['AC','WA','TLE','RE','PD','RJ'], default: 'PD', index: true },
	timeMs: { type: Number },
	memoryKb: { type: Number },
	stderr: { type: String },
	failedCaseId: { type: Schema.Types.ObjectId },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	// Similarity check results
	similarityScore: { type: Number, min: 0, max: 100 },
	similarSubmissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
	// Bug report from analysis
	bugReport: {
		type: {
			type: String,
			enum: ['infinite-loop', 'buffer-overflow', 'null-pointer', 'uninitialized-var', 'index-out-of-bounds', 'off-by-one']
		},
		explanation: String,
		affectedLines: [Number]
	}
})

SubmissionSchema.pre('save', function(next) {
	(this as any).updatedAt = new Date()
	next()
})

export type SubmissionDoc = InferSchemaType<typeof SubmissionSchema>
export default mongoose.model('Submission', SubmissionSchema)







