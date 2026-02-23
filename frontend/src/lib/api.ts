import axios from 'axios'

// Create axios instance with request/response logging
const api = axios.create({ 
    baseURL: 'http://localhost:3001',
    timeout: 5000
})

// Add logging interceptors
api.interceptors.request.use(request => {
    console.log('Request:', request.method?.toUpperCase(), request.url)
    return request
})

api.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.config.url)
        return response
    },
    error => {
        console.error('API Error:', error.message, error.config?.url)
        return Promise.reject(error)
    }
)

export default api

// Types for submission-related data
export interface BugReport {
	type: 'infinite-loop' | 'buffer-overflow' | 'null-pointer' | 'uninitialized-var' | 'index-out-of-bounds' | 'off-by-one'
	explanation: string
	affectedLines: number[]
}

export interface SimilarSubmission {
	_id: string
	userId: string
	createdAt: string
	language: string
}

export interface Submission {
	_id: string
	userId: string
	problemId: string
	language: 'cpp' | 'java' | 'python'
	sourceCode: string
	verdict: 'AC' | 'WA' | 'TLE' | 'RE' | 'PD' | 'RJ'
	timeMs?: number
	memoryKb?: number
	stderr?: string
	failedCaseId?: string
	createdAt: string
	updatedAt: string
	// New fields
	similarityScore?: number
	similarSubmissionId?: SimilarSubmission
	bugReport?: BugReport
}

// Simple token management
export function getToken(): string | null {
	return localStorage.getItem('token')
}

export function saveToken(token: string) {
	console.log('Saving token:', token.substring(0, 20) + '...')
	localStorage.setItem('token', token)
	// Set token in axios defaults
	api.defaults.headers.common['Authorization'] = `Bearer ${token}`
	console.log('Token set in axios defaults')
}

export function clearToken() {
	console.log('Clearing token')
	localStorage.removeItem('token')
	delete api.defaults.headers.common['Authorization']
}

// Initialize token on app start
const initialToken = getToken()
if (initialToken) {
	console.log('Found existing token:', initialToken.substring(0, 20) + '...')
	api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`
} else {
	console.log('No existing token found')
}

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
	(response) => {
		return response
	},
	(error) => {
		if (error.response?.status === 401) {
			console.log('401 Unauthorized - clearing token and redirecting')
			clearToken()
			if (window.location.pathname !== '/login') {
				window.location.href = '/login'
			}
		}
		return Promise.reject(error)
	}
)



