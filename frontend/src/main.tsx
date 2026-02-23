import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './pages/App'
import Login from './pages/Login'
import Register from './pages/Register'
import Problems from './pages/Problems'
import ProblemDetail from './pages/ProblemDetail'
import Submissions from './pages/Submissions'
import SubmissionDetail from './pages/SubmissionDetail'
import Leaderboard from './pages/Leaderboard'

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		children: [
			{ path: '/', element: <Problems /> },
			{ path: '/problems/:id', element: <ProblemDetail /> },
			{ path: '/submissions', element: <Submissions /> },
			{ path: '/submissions/:id', element: <SubmissionDetail /> },
			{ path: '/leaderboard', element: <Leaderboard /> },
			{ path: '/login', element: <Login /> },
			{ path: '/register', element: <Register /> },
		]
	}
])

createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
)







