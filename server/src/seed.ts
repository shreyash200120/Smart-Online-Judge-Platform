import 'dotenv/config'
import mongoose from 'mongoose'
import Problem from './models/Problem'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/oj'

const problems = [
	{
		title: 'A + B',
		description: 'Read two integers and output their sum.',
		inputFormat: 'Two integers a and b',
		outputFormat: 'Single integer a+b',
		testcases: [
			{ inputData: '1 2\n', expectedOutput: '3\n', isHidden: false },
			{ inputData: '-5 10\n', expectedOutput: '5\n', isHidden: true },
		],
	},
	{
		title: 'Factorial',
		description: 'Compute n! for 0 <= n <= 12.',
		inputFormat: 'Integer n',
		outputFormat: 'n!',
		testcases: [
			{ inputData: '5\n', expectedOutput: '120\n', isHidden: false },
			{ inputData: '0\n', expectedOutput: '1\n', isHidden: true },
		],
	},
	{
		title: 'Palindrome String',
		description: 'Check if a string is a palindrome (case-sensitive).',
		inputFormat: 'Single string s',
		outputFormat: 'YES or NO',
		testcases: [
			{ inputData: 'aba\n', expectedOutput: 'YES\n', isHidden: false },
			{ inputData: 'abc\n', expectedOutput: 'NO\n', isHidden: true },
		],
	},
	{
		title: 'Maximum of Array',
		description: 'Given n and an array of n integers, output the maximum.',
		inputFormat: 'n then n integers',
		outputFormat: 'max value',
		testcases: [
			{ inputData: '5\n1 3 2 9 4\n', expectedOutput: '9\n', isHidden: false },
			{ inputData: '3\n-5 -2 -9\n', expectedOutput: '-2\n', isHidden: true },
		],
	},
	{
		title: 'Fibonacci',
		description: 'Output the n-th Fibonacci number (0-indexed) for 0<=n<=30.',
		inputFormat: 'Integer n',
		outputFormat: 'F(n)',
		testcases: [
			{ inputData: '7\n', expectedOutput: '13\n', isHidden: false },
			{ inputData: '10\n', expectedOutput: '55\n', isHidden: true },
		],
	},
]

async function run() {
	const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/oj'
	await mongoose.connect(MONGO_URL)
	await Problem.deleteMany({})
	await Problem.insertMany(problems)
	console.log('Seeded 5 problems')
	await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })







