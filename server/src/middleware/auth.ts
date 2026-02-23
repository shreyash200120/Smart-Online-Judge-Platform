import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ParamsDictionary } from 'express-serve-static-core'

export interface AuthedRequest extends Request<ParamsDictionary, any, any> {
	user?: { id: string, username: string }
}

export function authOptional(req: AuthedRequest, _res: Response, next: NextFunction) {
	const h = req.headers.authorization
	if (h?.startsWith('Bearer ')) {
		try {
			const token = h.slice(7)
			const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me') as any
			req.user = { id: payload.sub, username: payload.username }
		} catch {}
	}
	next()
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
	authOptional(req, res, () => {
		if (!req.user) return res.status(401).json({ detail: 'Unauthorized' })
		next()
	})
}







