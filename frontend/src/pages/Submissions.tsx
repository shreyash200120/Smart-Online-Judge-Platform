import useSWR from 'swr'
import { api } from '../lib/api'
import { Link } from 'react-router-dom'

const fetcher = (url: string) => api.get(url).then(r=>r.data)

export default function Submissions() {
	const { data, error, isLoading } = useSWR('/submissions', fetcher)
	
	if (isLoading) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#e0e0e0',
			fontSize: '18px'
		}}>
			Loading submissions...
		</div>
	)
	
	if (error) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#ff6b6b',
			fontSize: '18px'
		}}>
			Error loading submissions: {error.message}
		</div>
	)
	
	return (
		<div style={{ 
			maxWidth: '1000px', 
			margin: '0 auto',
			padding: '20px'
		}}>
			<h2 style={{ 
				color: '#4ECDC4', 
				marginBottom: '30px',
				fontSize: '28px',
				fontWeight: '600'
			}}>
				📝 My Submissions
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
						No submissions yet
					</div>
				) : (
					<div style={{ overflow: 'auto' }}>
						<table style={{ 
							width: '100%',
							borderCollapse: 'collapse',
							color: '#e0e0e0'
						}}>
							<thead>
								<tr style={{ 
									background: 'rgba(78, 205, 196, 0.1)',
									borderBottom: '2px solid rgba(78, 205, 196, 0.3)'
								}}>
									<th style={{ 
										padding: '15px', 
										textAlign: 'left',
										fontWeight: '600',
										color: '#4ECDC4'
									}}>ID</th>
									<th style={{ 
										padding: '15px', 
										textAlign: 'left',
										fontWeight: '600',
										color: '#4ECDC4'
									}}>Problem</th>
									<th style={{ 
										padding: '15px', 
										textAlign: 'left',
										fontWeight: '600',
										color: '#4ECDC4'
									}}>Language</th>
									<th style={{ 
										padding: '15px', 
										textAlign: 'left',
										fontWeight: '600',
										color: '#4ECDC4'
									}}>Verdict</th>
									<th style={{ 
										padding: '15px', 
										textAlign: 'left',
										fontWeight: '600',
										color: '#4ECDC4'
									}}>Time</th>
									<th style={{ 
										padding: '15px', 
										textAlign: 'left',
										fontWeight: '600',
										color: '#4ECDC4'
									}}>Date</th>
								</tr>
							</thead>
							<tbody>
								{(data || []).map((s: any, index: number) => (
									<tr 
										key={s._id}
										style={{ 
											borderBottom: '1px solid rgba(255,255,255,0.1)',
											transition: 'background 0.3s ease'
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = 'rgba(78, 205, 196, 0.05)'
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = 'transparent'
										}}
									>
										<td style={{ padding: '15px' }}>
											<Link 
												to={`/submissions/${s._id}`}
												style={{ 
													color: '#4ECDC4',
													textDecoration: 'none',
													fontWeight: '600'
												}}
											>
												#{s._id.slice(-6)}
											</Link>
										</td>
										<td style={{ padding: '15px' }}>
											{s.problemId ? s.problemId.slice(-6) : 'Unknown'}
										</td>
										<td style={{ padding: '15px' }}>
											<span style={{
												background: s.language === 'cpp' ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 107, 107, 0.2)',
												color: s.language === 'cpp' ? '#4ECDC4' : '#FF6B6B',
												padding: '4px 8px',
												borderRadius: '4px',
												fontSize: '12px',
												fontWeight: '600',
												textTransform: 'uppercase'
											}}>
												{s.language}
											</span>
										</td>
										<td style={{ padding: '15px' }}>
											<span style={{
												background: s.verdict === 'AC' ? 'rgba(76, 175, 80, 0.2)' :
															s.verdict === 'WA' ? 'rgba(244, 67, 54, 0.2)' :
															s.verdict === 'TLE' ? 'rgba(255, 152, 0, 0.2)' :
															s.verdict === 'RE' ? 'rgba(156, 39, 176, 0.2)' :
															'rgba(158, 158, 158, 0.2)',
												color: s.verdict === 'AC' ? '#4CAF50' :
													   s.verdict === 'WA' ? '#f44336' :
													   s.verdict === 'TLE' ? '#FF9800' :
													   s.verdict === 'RE' ? '#9C27B0' :
													   '#9E9E9E',
												padding: '4px 8px',
												borderRadius: '4px',
												fontSize: '12px',
												fontWeight: '600',
												textTransform: 'uppercase'
											}}>
												{s.verdict}
											</span>
										</td>
										<td style={{ padding: '15px' }}>
											{s.timeMs ? `${s.timeMs}ms` : '-'}
										</td>
										<td style={{ padding: '15px', color: '#888' }}>
											{new Date(s.createdAt).toLocaleDateString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}



