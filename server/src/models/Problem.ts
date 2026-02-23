import mongoose, { Schema, InferSchemaType } from 'mongoose'

const TestCaseSchema = new Schema({
	inputData: { type: String, required: true },
	expectedOutput: { type: String, required: true },
	isHidden: { type: Boolean, default: true }
}, { _id: true })

const ProblemSchema = new Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	inputFormat: { type: String },
	outputFormat: { type: String },
	timeLimitMs: { type: Number, default: 2000 },
	memoryLimitMb: { type: Number, default: 256 },
	testcases: { type: [TestCaseSchema], default: [] },
	createdAt: { type: Date, default: Date.now }
})

export type ProblemDoc = InferSchemaType<typeof ProblemSchema>
export default mongoose.model('Problem', ProblemSchema)







