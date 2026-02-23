import { useState } from 'react'
import { api, saveToken } from '../lib/api'

export default function Login() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setIsLoading(true)
		
		try {
			console.log('Attempting login for user:', username)
			const params = new URLSearchParams()
			params.append('username', username)
			params.append('password', password)
			const { data } = await api.post('/auth/token', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
			console.log('Login response:', data)
			console.log('Access token received:', data.access_token ? 'YES' : 'NO')
			saveToken(data.access_token)
			console.log('Token saved successfully, redirecting...')
			// Test the token immediately
			setTimeout(() => {
				console.log('Testing token with API call...')
				api.get('/submissions').then(() => {
					console.log('✅ Token test successful!')
				}).catch((err) => {
					console.log('❌ Token test failed:', err.response?.status)
				})
			}, 1000)
			location.href = '/'
		} catch (e: any) {
			setError(e?.response?.data?.detail || 'Login failed. Please check your credentials.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div style={{
			maxWidth: '400px',
			margin: '50px auto',
			padding: '40px',
			background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
			borderRadius: '20px',
			boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
			color: 'white',
			border: '1px solid rgba(255,255,255,0.1)'
		}}>
			<div style={{ textAlign: 'center', marginBottom: '30px' }}>
				<h2 style={{ 
					margin: '0 0 10px 0', 
					fontSize: '28px', 
					fontWeight: '600',
					textShadow: '0 2px 4px rgba(0,0,0,0.3)'
				}}>
					Welcome Back
				</h2>
				<p style={{ 
					margin: '0', 
					opacity: '0.9', 
					fontSize: '14px' 
				}}>
					Sign in to your account
				</p>
			</div>

			<form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
				{error && (
					<div style={{ 
						background: 'rgba(244, 67, 54, 0.2)', 
						border: '1px solid rgba(244, 67, 54, 0.5)',
						color: '#f44336',
						padding: '12px',
						borderRadius: '8px',
						fontSize: '14px',
						textAlign: 'center'
					}}>
						❌ {error}
					</div>
				)}

				<div style={{ position: 'relative' }}>
					<input 
						placeholder="Username" 
						value={username} 
						onChange={e => setUsername(e.target.value)}
						required
						style={{
							width: '100%',
							padding: '15px 20px',
							border: 'none',
							borderRadius: '12px',
							background: 'rgba(255,255,255,0.1)',
							color: 'white',
							fontSize: '16px',
							backdropFilter: 'blur(10px)',
							boxSizing: 'border-box',
							outline: 'none',
							transition: 'all 0.3s ease'
						}}
						onFocus={(e) => {
							e.target.style.background = 'rgba(255,255,255,0.2)'
							e.target.style.transform = 'translateY(-2px)'
						}}
						onBlur={(e) => {
							e.target.style.background = 'rgba(255,255,255,0.1)'
							e.target.style.transform = 'translateY(0)'
						}}
					/>
				</div>

				<div style={{ position: 'relative' }}>
					<input 
						placeholder="Password" 
						type="password" 
						value={password} 
						onChange={e => setPassword(e.target.value)}
						required
						style={{
							width: '100%',
							padding: '15px 20px',
							border: 'none',
							borderRadius: '12px',
							background: 'rgba(255,255,255,0.1)',
							color: 'white',
							fontSize: '16px',
							backdropFilter: 'blur(10px)',
							boxSizing: 'border-box',
							outline: 'none',
							transition: 'all 0.3s ease'
						}}
						onFocus={(e) => {
							e.target.style.background = 'rgba(255,255,255,0.2)'
							e.target.style.transform = 'translateY(-2px)'
						}}
						onBlur={(e) => {
							e.target.style.background = 'rgba(255,255,255,0.1)'
							e.target.style.transform = 'translateY(0)'
						}}
					/>
				</div>

				<button 
					type="submit" 
					disabled={isLoading}
					style={{
						width: '100%',
						padding: '15px',
						border: 'none',
						borderRadius: '12px',
						background: isLoading 
							? 'rgba(255,255,255,0.3)' 
							: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
						color: 'white',
						fontSize: '16px',
						fontWeight: '600',
						cursor: isLoading ? 'not-allowed' : 'pointer',
						transition: 'all 0.3s ease',
						textTransform: 'uppercase',
						letterSpacing: '1px',
						boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
					}}
					onMouseEnter={(e) => {
						if (!isLoading) {
							e.currentTarget.style.transform = 'translateY(-2px)'
							e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
						}
					}}
					onMouseLeave={(e) => {
						if (!isLoading) {
							e.currentTarget.style.transform = 'translateY(0)'
							e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
						}
					}}
				>
					{isLoading ? 'Signing In...' : 'Sign In'}
				</button>
			</form>

			<div style={{ 
				textAlign: 'center', 
				marginTop: '30px',
				fontSize: '14px',
				opacity: '0.8'
			}}>
				Don't have an account?{' '}
				<a 
					href="/register" 
					style={{ 
						color: '#4ECDC4', 
						textDecoration: 'none',
						fontWeight: '600'
					}}
				>
					Create one here
				</a>
			</div>
		</div>
	)
}


