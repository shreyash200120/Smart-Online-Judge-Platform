import useSWR from 'swr'
import api from '../lib/api'
import { Link } from 'react-router-dom'

const fetcher = (url: string) => api.get(url).then(r=>r.data)

export default function Problems() {
	const { data, error, isLoading } = useSWR('/problems', fetcher)
	
	if (isLoading) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#e0e0e0',
			fontSize: '18px'
		}}>
			Loading problems...
		</div>
	)
	
	if (error) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#ff6b6b',
			fontSize: '18px'
		}}>
			Error loading problems: {error.message}
		</div>
	)
	
	return (
		<div style={{ 
			maxWidth: '800px', 
			margin: '0 auto',
			padding: '20px'
		}}>
			<h2 style={{ 
				color: '#e0e0e0', 
				marginBottom: '30px',
				fontSize: '28px',
				fontWeight: '600'
			}}>
				🏆 Problems
			</h2>
			
			<div style={{ 
				display: 'grid', 
				gap: '20px'
			}}>
				{(data || []).map((p: any) => (
					<div 
						key={p._id} 
						style={{
							background: 'rgba(255,255,255,0.05)',
							border: '1px solid rgba(255,255,255,0.1)',
							borderRadius: '12px',
							padding: '20px',
							transition: 'all 0.3s ease',
							cursor: 'pointer'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
							e.currentTarget.style.transform = 'translateY(-2px)'
							e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
							e.currentTarget.style.transform = 'translateY(0)'
							e.currentTarget.style.boxShadow = 'none'
						}}
					>
						<Link 
							to={`/problems/${p._id}`}
							style={{ 
								textDecoration: 'none',
								color: 'inherit'
							}}
						>
							<h3 style={{ 
								color: '#4ECDC4', 
								margin: '0 0 10px 0',
								fontSize: '20px',
								fontWeight: '600'
							}}>
								{p.title}
							</h3>
							<p style={{ 
								color: '#b0b0b0', 
								margin: '0 0 15px 0',
								lineHeight: '1.5'
							}}>
								{p.description}
							</p>
							<div style={{ 
								display: 'flex', 
								gap: '20px',
								fontSize: '14px',
								color: '#888'
							}}>
								<span>⏱️ Time Limit: {p.timeLimitMs}ms</span>
								<span>💾 Memory Limit: {p.memoryLimitMb}MB</span>
							</div>
						</Link>
					</div>
				))}
			</div>
			
			{(!data || data.length === 0) && (
				<div style={{ 
					textAlign: 'center', 
					padding: '50px',
					color: '#888',
					fontSize: '18px'
				}}>
					No problems available
				</div>
			)}
		</div>
	)
}


