import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { json, urlencoded } from 'express'
import authRouter from './routes/auth'
import problemsRouter from './routes/problems'
import submissionsRouter from './routes/submissions'
import statsRouter from './routes/stats'

const PORT = process.env.PORT || 3000
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/oj'

async function connectWithRetry(maxAttempts = 30, delayMs = 1000) {
	let attempt = 0
	while (true) {
		try {
			await mongoose.connect(MONGO_URL)
			console.log('Mongo connected')
			return
		} catch (err) {
			attempt++
			console.error(`Mongo connect failed (attempt ${attempt}/${maxAttempts})`, err)
			if (attempt >= maxAttempts) throw err
			await new Promise(r => setTimeout(r, delayMs))
		}
	}
}

async function main() {
	await connectWithRetry()
	const app = express()
	
	// Log all requests
	app.use((req, res, next) => {
		console.log(`${req.method} ${req.url}`)
		next()
	})

	// Configure CORS
	app.use(cors({
		origin: ['http://localhost:5173', 'http://localhost:3000'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true
	}))

	app.use(json({ limit: '1mb' }))
	app.use(urlencoded({ extended: true }))

	// Health check
	app.get('/health', (_req, res) => res.json({ ok: true }))

	// API routes
	app.use('/problems', problemsRouter)
	app.use('/submissions', submissionsRouter)
	app.use('/auth', authRouter)
	app.use('/stats', statsRouter)

	app.get('/', (_req, res) => res.json({ message: 'OJ API running' }))

	app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})

