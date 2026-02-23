import { execFile } from 'node:child_process'
import { writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Language configurations
const LANG_CONFIG = {
  cpp: {
    image: process.env.CPP_IMAGE || 'gcc:13',
    sourceFile: 'Main.cpp',
    compile: ['g++', '-O2', '-std=c++17', 'Main.cpp', '-o', 'Main'],
    run: ['./Main'],
    needsCompile: true
  },
  python: {
    image: process.env.PYTHON_IMAGE || 'python:3.12-slim',
    sourceFile: 'main.py',
    run: ['python', '-u', 'main.py'],  // -u for unbuffered output
    needsCompile: false
  },
  java: {
    image: process.env.JAVA_IMAGE || 'openjdk:21',
    sourceFile: 'Main.java',
    compile: ['javac', 'Main.java'],
    run: ['java', 'Main'],
    needsCompile: true
  }
} as const

type LangConfigType = typeof LANG_CONFIG
type LangType = keyof LangConfigType

// Docker security options
const DOCKER_SECURITY_OPTS = [
  '--security-opt=no-new-privileges',
  '--net=none',                    // Disable network access
  '--pids-limit=1000',            // Limit number of processes
  '--ulimit', 'nproc=1000:1000',  // Process limit
  '--ulimit', 'fsize=10000000',   // 10MB file size limit
  '--cap-drop=ALL'                // Drop all capabilities
]

interface ExecutionResult {
  code: number
  stdout: string
  stderr: string
  memoryKb?: number
  timeMs?: number
}

async function runDocker(
  image: string,
  workdir: string,
  cmd: string[],
  timeLimitMs: number,
  memoryMb: number,
  args: string[] = []
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const dockerArgs = [
      'run',
      '--rm',
      '-m', `${memoryMb}m`,
      '--cpus', '1.0',
      '-v', `${workdir}:/work`,
      '-w', '/work',
      ...DOCKER_SECURITY_OPTS,
      ...args,
      image,
      ...cmd
    ]

    let startTime = Date.now()
    execFile('docker', dockerArgs, {
      timeout: Math.max(1000, timeLimitMs + 1000)
    }, (err, stdout, stderr) => {
      const endTime = Date.now()
      const timeMs = endTime - startTime

      // Handle timeout case
      if (err && (err as any).killed) {
        return resolve({
          code: 124,
          stdout: '',
          stderr: 'Time Limit Exceeded',
          timeMs
        })
      }

      // Get memory usage from docker stats
      execFile('docker', ['stats', '--no-stream', '--format', '{{.MemUsage}}'], (err, memStats) => {
        const memoryKb = err ? undefined : parseInt(memStats) * 1024
        
        resolve({
          code: err ? (err as any).code ?? 1 : 0,
          stdout: String(stdout),
          stderr: String(stderr),
          memoryKb,
          timeMs
        })
      })
    })
  })
}

export async function executeCode(
  language: keyof typeof LANG_CONFIG,
  source: string,
  input: string,
  timeLimitMs: number,
  memoryLimitMb: number
): Promise<ExecutionResult> {
  // Create temp directory
  const dir = await mkdtemp(join(tmpdir(), 'oj-'))
  try {
    const config = LANG_CONFIG[language]
    
    // Write source code
    await writeFile(join(dir, config.sourceFile), source)
    await writeFile(join(dir, 'input.txt'), input)

    // Compile if needed
    if (config.needsCompile) {
      const compileResult = await runDocker(
        config.image,
        dir,
        [...config.compile],
        timeLimitMs,
        memoryLimitMb,
        ['--memory-swap=-1'] // No swap during compilation
      )
      
      if (compileResult.code !== 0) {
        return {
          ...compileResult,
          stderr: 'Compilation Error:\n' + compileResult.stderr
        }
      }
    }

    // Run with input
    const runResult = await runDocker(
      config.image,
      dir,
      [...config.run, '<', 'input.txt'].map(s => s),
      timeLimitMs,
      memoryLimitMb
    )

    return runResult

  } finally {
    // Cleanup
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

// Helper to compare output while ignoring whitespace differences
export function compareOutput(expected: string, actual: string): boolean {
  return expected.trim().replace(/\s+/g, ' ') === actual.trim().replace(/\s+/g, ' ')
}

// Generate a readable diff between expected and actual output
export function generateDiff(expected: string, actual: string): string {
  const ex = expected.trim().split(/\r?\n/)
  const ac = actual.trim().split(/\r?\n/)
  const lines: string[] = []

  for (let i = 0; i < Math.max(ex.length, ac.length); i++) {
    const e = ex[i] ?? '<no line>'
    const a = ac[i] ?? '<no line>'
    if (e !== a) {
      lines.push(`Line ${i + 1}:`)
      lines.push(`  Expected: ${e}`)
      lines.push(`  Actual:   ${a}`)
    }
  }

  // Limit diff size
  const diff = lines.join('\n')
  return diff.length > 5000 ? diff.slice(0, 4997) + '...' : diff
}