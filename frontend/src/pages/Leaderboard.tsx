import useSWR from 'swr'
import { api } from '../lib/api'

const fetcher = (url: string) => api.get(url).then(r=>r.data)

export default function Leaderboard() {
	const { data, error, isLoading } = useSWR('/stats/leaderboard', fetcher)
	
	if (isLoading) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#e0e0e0',
			fontSize: '18px'
		}}>
			Loading leaderboard...
		</div>
	)
	
	if (error) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#ff6b6b',
			fontSize: '18px'
		}}>
			Error loading leaderboard: {error.message}
		</div>
	)
	
	return (
		<div style={{ 
			maxWidth: '800px', 
			margin: '0 auto',
			padding: '20px'
		}}>
			<h2 style={{ 
				color: '#4ECDC4', 
				marginBottom: '30px',
				fontSize: '28px',
				fontWeight: '600',
				textAlign: 'center'
			}}>
				🏅 Leaderboard
			</h2>
			
			<div style={{
				background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
				border: '1px solid rgba(78, 205, 196, 0.3)',
				borderRadius: '16px',
				padding: '30px',
				boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
			}}>
				{(!data || data.length === 0) ? (
					<div style={{ 
						textAlign: 'center', 
						padding: '50px',
						color: '#888',
						fontSize: '18px'
					}}>
						No leaderboard data available
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
						{(data || []).map((r: any, index: number) => (
							<div 
								key={r.username}
								style={{
									background: index === 0 ? 'rgba(255, 215, 0, 0.1)' :
												index === 1 ? 'rgba(192, 192, 192, 0.1)' :
												index === 2 ? 'rgba(205, 127, 50, 0.1)' :
												'rgba(255,255,255,0.05)',
									border: index === 0 ? '1px solid rgba(255, 215, 0, 0.3)' :
											index === 1 ? '1px solid rgba(192, 192, 192, 0.3)' :
											index === 2 ? '1px solid rgba(205, 127, 50, 0.3)' :
											'1px solid rgba(255,255,255,0.1)',
									borderRadius: '12px',
									padding: '20px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									transition: 'all 0.3s ease'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-2px)'
									e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)'
									e.currentTarget.style.boxShadow = 'none'
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
									<div style={{
										width: '40px',
										height: '40px',
										borderRadius: '50%',
										background: index === 0 ? 'linear-gradient(45deg, #FFD700, #FFA500)' :
													index === 1 ? 'linear-gradient(45deg, #C0C0C0, #A8A8A8)' :
													index === 2 ? 'linear-gradient(45deg, #CD7F32, #B8860B)' :
													'linear-gradient(45deg, #4ECDC4, #44A08D)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontWeight: '700',
										fontSize: '18px',
										color: index < 3 ? '#000' : '#fff',
										boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
									}}>
										{index + 1}
									</div>
									<div>
										<h3 style={{ 
											margin: '0',
											color: index < 3 ? '#FFD700' : '#4ECDC4',
											fontSize: '20px',
											fontWeight: '600'
										}}>
											{r.username}
										</h3>
										<p style={{ 
											margin: '5px 0 0 0',
											color: '#888',
											fontSize: '14px'
										}}>
											{index === 0 ? '🥇 Gold Medal' :
											 index === 1 ? '🥈 Silver Medal' :
											 index === 2 ? '🥉 Bronze Medal' :
											 'Competitor'}
										</p>
									</div>
								</div>
								
								<div style={{ textAlign: 'right' }}>
									<div style={{
										background: 'rgba(76, 175, 80, 0.2)',
										color: '#4CAF50',
										padding: '8px 16px',
										borderRadius: '20px',
										fontSize: '18px',
										fontWeight: '700',
										border: '1px solid rgba(76, 175, 80, 0.3)'
									}}>
										{r.accepted || 0} AC
									</div>
									<p style={{ 
										margin: '5px 0 0 0',
										color: '#888',
										fontSize: '12px'
									}}>
										Accepted Solutions
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}



