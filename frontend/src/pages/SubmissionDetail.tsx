import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { api } from '../lib/api'

const fetcher = (url: string) => api.get(url).then(r=>r.data)

export default function SubmissionDetail() {
	const { id } = useParams()
	const { data: s, error, isLoading } = useSWR(id ? `/submissions/${id}` : null, fetcher)
	
	if (isLoading) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#e0e0e0',
			fontSize: '18px'
		}}>
			Loading submission...
		</div>
	)
	
	if (error) return (
		<div style={{ 
			textAlign: 'center', 
			padding: '50px',
			color: '#ff6b6b',
			fontSize: '18px'
		}}>
			Error loading submission: {error.message}
		</div>
	)
	
	if (!s) return null
	
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
				📝 Submission #{s._id?.slice(-6) || id}
			</h2>
			
			<div style={{
				background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
				border: '1px solid rgba(78, 205, 196, 0.3)',
				borderRadius: '16px',
				padding: '30px',
				boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
				marginBottom: '30px'
			}}>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
					<div>
						<h4 style={{ 
							color: '#4ECDC4', 
							margin: '0 0 10px 0',
							fontSize: '16px',
							fontWeight: '600'
						}}>
							Verdict
						</h4>
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
							padding: '8px 16px',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							textTransform: 'uppercase',
							border: `1px solid ${s.verdict === 'AC' ? 'rgba(76, 175, 80, 0.3)' :
												s.verdict === 'WA' ? 'rgba(244, 67, 54, 0.3)' :
												s.verdict === 'TLE' ? 'rgba(255, 152, 0, 0.3)' :
												s.verdict === 'RE' ? 'rgba(156, 39, 176, 0.3)' :
												'rgba(158, 158, 158, 0.3)'}`
						}}>
							{s.verdict}
						</span>
					</div>
					
					<div>
						<h4 style={{ 
							color: '#4ECDC4', 
							margin: '0 0 10px 0',
							fontSize: '16px',
							fontWeight: '600'
						}}>
							Language
						</h4>
						<span style={{
							background: s.language === 'cpp' ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 107, 107, 0.2)',
							color: s.language === 'cpp' ? '#4ECDC4' : '#FF6B6B',
							padding: '8px 16px',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							textTransform: 'uppercase',
							border: `1px solid ${s.language === 'cpp' ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
						}}>
							{s.language}
						</span>
					</div>
					
					<div>
						<h4 style={{ 
							color: '#4ECDC4', 
							margin: '0 0 10px 0',
							fontSize: '16px',
							fontWeight: '600'
						}}>
							Time
						</h4>
						<div style={{ color: '#e0e0e0', fontSize: '16px' }}>
							{s.timeMs ? `${s.timeMs}ms` : '-'}
						</div>
					</div>
					
					<div>
						<h4 style={{ 
							color: '#4ECDC4', 
							margin: '0 0 10px 0',
							fontSize: '16px',
							fontWeight: '600'
						}}>
							Memory
						</h4>
						<div style={{ color: '#e0e0e0', fontSize: '16px' }}>
							{s.memoryKb ? `${s.memoryKb}KB` : '-'}
						</div>
					</div>
				</div>
				
				<div>
					<h4 style={{ 
						color: '#4ECDC4', 
						margin: '0 0 10px 0',
						fontSize: '16px',
						fontWeight: '600'
					}}>
						Submitted At
					</h4>
					<div style={{ color: '#e0e0e0', fontSize: '16px' }}>
						{new Date(s.createdAt).toLocaleString()}
					</div>
				</div>
			</div>
			
			{s.stderr && (
				<div style={{
					background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
					border: '1px solid rgba(78, 205, 196, 0.3)',
					borderRadius: '16px',
					padding: '30px',
					boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
					marginBottom: '30px'
				}}>
					<h3 style={{ 
						color: '#4ECDC4', 
						margin: '0 0 20px 0',
						fontSize: '20px',
						fontWeight: '600'
					}}>
						📋 Error Details
					</h3>
					<pre style={{ 
						background: 'rgba(0,0,0,0.4)',
						padding: '20px',
						borderRadius: '8px',
						color: '#e0e0e0',
						fontSize: '14px',
						overflow: 'auto',
						border: '1px solid rgba(78, 205, 196, 0.2)',
						fontFamily: 'Monaco, Consolas, "Courier New", monospace',
						whiteSpace: 'pre-wrap',
						lineHeight: '1.5'
					}}>
						{s.stderr}
					</pre>
				</div>
			)}
			
			<div style={{
				background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
				border: '1px solid rgba(78, 205, 196, 0.3)',
				borderRadius: '16px',
				padding: '30px',
				boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
			}}>
				<h3 style={{ 
					color: '#4ECDC4', 
					margin: '0 0 20px 0',
					fontSize: '20px',
					fontWeight: '600'
				}}>
					💻 Source Code
				</h3>
				<div style={{
					background: 'rgba(0,0,0,0.4)',
					border: '1px solid rgba(78, 205, 196, 0.2)',
					borderRadius: '8px',
					overflow: 'hidden'
				}}>
					<div style={{
						background: 'rgba(0,0,0,0.6)',
						padding: '10px 15px',
						borderBottom: '1px solid rgba(78, 205, 196, 0.2)',
						color: '#4ECDC4',
						fontSize: '14px',
						fontWeight: '600'
					}}>
						{s.language?.toUpperCase()} Code
					</div>
					<pre style={{ 
						padding: '20px',
						color: '#e0e0e0',
						fontSize: '14px',
						overflow: 'auto',
						fontFamily: 'Monaco, Consolas, "Courier New", monospace',
						whiteSpace: 'pre-wrap',
						lineHeight: '1.5',
						margin: '0'
					}}>
						{s.sourceCode}
					</pre>
				</div>
			</div>
		</div>
	)
}



