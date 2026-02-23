import { Outlet, Link } from 'react-router-dom'
import { getToken, clearToken } from '../lib/api'

export default function App() {
	const token = getToken()
	return (
		<div style={{ 
			minHeight: '100vh',
			background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%)',
			fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
		}}>
			<nav style={{ 
				background: 'rgba(0,0,0,0.9)',
				backdropFilter: 'blur(15px)',
				padding: '20px 0',
				boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
				position: 'sticky',
				top: 0,
				zIndex: 100,
				borderBottom: '1px solid rgba(78, 205, 196, 0.2)'
			}}>
				<div style={{ 
					maxWidth: 1200, 
					margin: '0 auto', 
					padding: '0 20px',
					display: 'flex', 
					alignItems: 'center',
					gap: '30px' 
				}}>
					<div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
						<Link 
							to="/" 
							style={{ 
								textDecoration: 'none', 
								color: '#4ECDC4',
								fontWeight: '600',
								fontSize: '18px',
								padding: '8px 16px',
								borderRadius: '8px',
								transition: 'all 0.3s ease'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = 'rgba(78, 205, 196, 0.2)'
								e.currentTarget.style.transform = 'translateY(-2px)'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'transparent'
								e.currentTarget.style.transform = 'translateY(0)'
							}}
						>
							🏆 Problems
						</Link>
						<Link 
							to="/submissions" 
							style={{ 
								textDecoration: 'none', 
								color: '#4ECDC4',
								fontWeight: '600',
								fontSize: '16px',
								padding: '8px 16px',
								borderRadius: '8px',
								transition: 'all 0.3s ease'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = 'rgba(78, 205, 196, 0.2)'
								e.currentTarget.style.transform = 'translateY(-2px)'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'transparent'
								e.currentTarget.style.transform = 'translateY(0)'
							}}
						>
							📝 My Submissions
						</Link>
						<Link 
							to="/leaderboard" 
							style={{ 
								textDecoration: 'none', 
								color: '#4ECDC4',
								fontWeight: '600',
								fontSize: '16px',
								padding: '8px 16px',
								borderRadius: '8px',
								transition: 'all 0.3s ease'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = 'rgba(78, 205, 196, 0.2)'
								e.currentTarget.style.transform = 'translateY(-2px)'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'transparent'
								e.currentTarget.style.transform = 'translateY(0)'
							}}
						>
							🏅 Leaderboard
						</Link>
					</div>
					
					<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
						{token ? (
							<button 
								onClick={() => { 
									clearToken(); 
									location.href='/' 
								}}
								style={{
									background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
									color: 'white',
									border: 'none',
									padding: '10px 20px',
									borderRadius: '8px',
									fontWeight: '600',
									cursor: 'pointer',
									transition: 'all 0.3s ease',
									boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-2px)'
									e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)'
									e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
								}}
							>
								🚪 Logout
							</button>
						) : (
							<>
								<Link 
									to="/login" 
									style={{ 
										textDecoration: 'none', 
										color: '#4ECDC4',
										fontWeight: '600',
										padding: '10px 20px',
										borderRadius: '8px',
										border: '2px solid #4ECDC4',
										transition: 'all 0.3s ease'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#4ECDC4'
										e.currentTarget.style.color = '#1a1a1a'
										e.currentTarget.style.transform = 'translateY(-2px)'
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'transparent'
										e.currentTarget.style.color = '#4ECDC4'
										e.currentTarget.style.transform = 'translateY(0)'
									}}
								>
									🔑 Login
								</Link>
								<Link 
									to="/register" 
									style={{ 
										textDecoration: 'none', 
										color: 'white',
										fontWeight: '600',
										padding: '10px 20px',
										borderRadius: '8px',
										background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
										transition: 'all 0.3s ease',
										boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.transform = 'translateY(-2px)'
										e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.transform = 'translateY(0)'
										e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
									}}
								>
									✨ Register
								</Link>
							</>
						)}
					</div>
				</div>
			</nav>
			
			<div style={{ 
				maxWidth: 1200, 
				margin: '0 auto', 
				padding: '40px 20px',
				minHeight: 'calc(100vh - 100px)'
			}}>
				<Outlet />
			</div>
		</div>
	)
}


