import mongoose, { Schema, InferSchemaType } from 'mongoose'

const UserSchema = new Schema({
	username: { type: String, unique: true, index: true, required: true },
	passwordHash: { type: String, required: true },
	createdAt: { type: Date, default: Date.now }
})

export type UserDoc = InferSchemaType<typeof UserSchema>
export default mongoose.model('User', UserSchema)







