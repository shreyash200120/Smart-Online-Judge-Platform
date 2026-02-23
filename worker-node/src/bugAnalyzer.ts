type TokenType = 
  | 'identifier'
  | 'number'
  | 'keyword'
  | 'operator'
  | 'punctuation'
  | 'whitespace'
  | 'newline'

interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

function tokenizeCode(code: string, language: 'cpp' | 'java' | 'python'): Token[] {
  // This is a simplified tokenizer - in production you'd use a proper parser
  const tokens: Token[] = []
  let line = 1
  let column = 1
  let i = 0

  const isDigit = (c: string) => /[0-9]/.test(c)
  const isLetter = (c: string) => /[a-zA-Z_]/.test(c)
  const isWhitespace = (c: string) => /[ \t]/.test(c)
  const operators = new Set(['+', '-', '*', '/', '%', '=', '==', '!=', '<', '<=', '>', '>=', '++', '--'])
  const keywords = new Set(['for', 'while', 'if', 'else', 'return', 'break', 'continue'])

  while (i < code.length) {
    const c = code[i]

    if (c === '\n') {
      tokens.push({ type: 'newline', value: '\n', line, column })
      line++
      column = 1
      i++
      continue
    }

    if (isWhitespace(c)) {
      let value = ''
      while (i < code.length && isWhitespace(code[i])) {
        value += code[i]
        i++
        column++
      }
      tokens.push({ type: 'whitespace', value, line, column: column - value.length })
      continue
    }

    if (isDigit(c)) {
      let value = ''
      while (i < code.length && isDigit(code[i])) {
        value += code[i]
        i++
        column++
      }
      tokens.push({ type: 'number', value, line, column: column - value.length })
      continue
    }

    if (isLetter(c)) {
      let value = ''
      while (i < code.length && (isLetter(code[i]) || isDigit(code[i]))) {
        value += code[i]
        i++
        column++
      }
      const type = keywords.has(value) ? 'keyword' : 'identifier'
      tokens.push({ type, value, line, column: column - value.length })
      continue
    }

    // Handle operators
    let found = false
    for (const op of [...operators].sort((a, b) => b.length - a.length)) {
      if (code.slice(i, i + op.length) === op) {
        tokens.push({ type: 'operator', value: op, line, column })
        i += op.length
        column += op.length
        found = true
        break
      }
    }
    if (found) continue

    // Everything else is punctuation
    tokens.push({ type: 'punctuation', value: c, line, column })
    i++
    column++
  }

  return tokens
}

interface BugPattern {
  name: string
  description: string
  hint: string
  detect: (tokens: Token[]) => { found: boolean, line?: number, details?: string }
}

// Bug pattern detectors
const bugPatterns: BugPattern[] = [
  {
    name: 'Loop Off By One',
    description: 'Array index might go out of bounds or miss the last element',
    hint: 'Check your loop conditions. Use <= for inclusive ranges and < for exclusive ranges.',
    detect: (tokens) => {
      let inLoop = false
      let hasArrayAccess = false
      let loopLine = 0

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (t.type === 'keyword' && (t.value === 'for' || t.value === 'while')) {
          inLoop = true
          loopLine = t.line
        }
        if (inLoop && t.type === 'punctuation' && t.value === '[') {
          hasArrayAccess = true
        }
        if (inLoop && hasArrayAccess && t.type === 'operator' && ['<', '<=', '>', '>='].includes(t.value)) {
          const nextToken = tokens[i + 1]
          if (nextToken?.type === 'number' && nextToken.value === '1') {
            return {
              found: true,
              line: loopLine,
              details: 'Found loop with array access using +/-1 boundary condition'
            }
          }
        }
        if (t.type === 'punctuation' && t.value === '}') {
          inLoop = false
          hasArrayAccess = false
        }
      }
      return { found: false }
    }
  },
  {
    name: 'Missing Base Case',
    description: 'Recursion might not terminate due to missing base case',
    hint: 'Add a base case that handles the smallest possible input without recursion',
    detect: (tokens) => {
      let functionName = ''
      let inFunction = false
      let hasBaseCase = false
      let functionLine = 0
      let hasFunctionCall = false

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (!inFunction && t.type === 'identifier' && tokens[i+1]?.type === 'punctuation' && tokens[i+1].value === '(') {
          functionName = t.value
          inFunction = true
          functionLine = t.line
        }
        if (inFunction && t.type === 'keyword' && (t.value === 'if' || t.value === 'return')) {
          hasBaseCase = true
        }
        if (inFunction && t.type === 'identifier' && t.value === functionName) {
          hasFunctionCall = true
        }
        if (t.type === 'punctuation' && t.value === '}') {
          if (inFunction && hasFunctionCall && !hasBaseCase) {
            return {
              found: true,
              line: functionLine,
              details: `Function ${functionName} appears to be recursive but may be missing a base case`
            }
          }
          inFunction = false
          hasBaseCase = false
          hasFunctionCall = false
        }
      }
      return { found: false }
    }
  },
  {
    name: 'Index Out of Bounds',
    description: 'Array access might exceed bounds',
    hint: 'Validate array indices before access and check array lengths',
    detect: (tokens) => {
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (t.type === 'punctuation' && t.value === '[') {
          const prev = tokens[i-1]
          const next = tokens[i+1]
          if (next?.type === 'number' || 
             (next?.type === 'identifier' && !tokens.slice(0, i).some(t => t.value === next.value))) {
            return {
              found: true,
              line: t.line,
              details: 'Array access without bounds checking'
            }
          }
        }
      }
      return { found: false }
    }
  },
  {
    name: 'Infinite Loop',
    description: 'Loop condition might never become false',
    hint: 'Ensure loop variables are modified inside the loop and condition will eventually be false',
    detect: (tokens) => {
      let inLoop = false
      let loopLine = 0
      let loopVar = ''
      let varModified = false

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (t.type === 'keyword' && (t.value === 'for' || t.value === 'while')) {
          inLoop = true
          loopLine = t.line
          // Find loop variable in condition
          for (let j = i + 1; j < tokens.length; j++) {
            if (tokens[j].type === 'punctuation' && tokens[j].value === ')') break
            if (tokens[j].type === 'identifier') {
              loopVar = tokens[j].value
              break
            }
          }
        }
        if (inLoop && t.type === 'identifier' && t.value === loopVar) {
          const nextToken = tokens[i + 1]
          if (nextToken?.type === 'operator' && ['=', '+=', '-=', '++', '--'].includes(nextToken.value)) {
            varModified = true
          }
        }
        if (t.type === 'punctuation' && t.value === '}') {
          if (inLoop && !varModified && loopVar) {
            return {
              found: true,
              line: loopLine,
              details: `Loop variable '${loopVar}' is not modified inside the loop`
            }
          }
          inLoop = false
          loopVar = ''
          varModified = false
        }
      }
      return { found: false }
    }
  }
]

export function analyzeBugs(sourceCode: string, language: 'cpp' | 'java' | 'python'): string[] {
  const tokens = tokenizeCode(sourceCode, language)
  const findings: string[] = []

  for (const pattern of bugPatterns) {
    const result = pattern.detect(tokens)
    if (result.found) {
      findings.push(
        `Potential ${pattern.name} at line ${result.line}:\n` +
        `  ${pattern.description}\n` +
        `  Details: ${result.details}\n` +
        `  Hint: ${pattern.hint}`
      )
    }
  }

  return findings
}