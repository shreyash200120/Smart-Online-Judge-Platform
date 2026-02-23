import mongoose, { Schema } from 'mongoose'

const ExternalSolutionSchema = new Schema({
  problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
  platform: { type: String, enum: ['leetcode', 'hackerrank'], required: true },
  platformProblemId: { type: String, required: true },
  language: { type: String, enum: ['cpp', 'java', 'python'], required: true },
  sourceCode: { type: String, required: true },
  author: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

// Create compound index to ensure unique solutions per problem per platform
ExternalSolutionSchema.index({ problemId: 1, platform: 1, platformProblemId: 1 }, { unique: true })

export default mongoose.model('ExternalSolution', ExternalSolutionSchema)