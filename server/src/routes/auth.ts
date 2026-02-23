import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User'

const router = Router()

router.post('/register', async (req, res) => {
	const { username, password } = req.body || {}
	if (!username || !password) return res.status(400).json({ detail: 'username/password required' })
	const existing = await User.findOne({ username })
	if (existing) return res.status(400).json({ detail: 'Username already exists' })
	const passwordHash = await bcrypt.hash(password, 10)
	const user = await User.create({ username, passwordHash })
	return res.json({ id: user._id, username: user.username, createdAt: user.createdAt })
})

router.post('/token', async (req, res) => {
	const { username, password } = req.body || {}
	if (!username || !password) return res.status(400).json({ detail: 'username/password required' })
	const user = await User.findOne({ username })
	if (!user) return res.status(400).json({ detail: 'Incorrect username or password' })
	const ok = await bcrypt.compare(password, user.passwordHash)
	if (!ok) return res.status(400).json({ detail: 'Incorrect username or password' })
	const token = jwt.sign({ sub: String(user._id), username: user.username }, process.env.JWT_SECRET || 'change-me', { expiresIn: '1h' })
	return res.json({ access_token: token, token_type: 'bearer' })
})

export default router







