interface NormalizedToken {
  type: 'keyword' | 'operator' | 'identifier' | 'literal' | 'structure'
  value: string
}

/**
 * Normalize a code string by:
 * 1. Removing comments
 * 2. Standardizing whitespace
 * 3. Converting identifiers to generic names
 * 4. Converting literals to placeholders
 */
function normalizeCode(code: string, language: 'cpp' | 'java' | 'python'): string {
  // Remove comments
  code = removeComments(code, language)

  // Convert to single-line format
  code = code.replace(/\r?\n/g, ' ')

  // Normalize whitespace
  code = code.replace(/\s+/g, ' ').trim()

  // Replace string literals with placeholder
  code = code.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, 'STR_LITERAL')

  // Replace numeric literals with placeholder
  code = code.replace(/\b\d+(\.\d+)?\b/g, 'NUM_LITERAL')

  // Replace identifiers with generic names
  const identifiers = new Map<string, string>()
  let idCounter = 0
  code = code.replace(/\b[a-zA-Z_]\w*\b/g, (match) => {
    if (isKeyword(match, language)) return match
    if (!identifiers.has(match)) {
      identifiers.set(match, `ID_${idCounter++}`)
    }
    return identifiers.get(match)!
  })

  return code
}

/**
 * Language-specific keywords lists
 */
const KEYWORDS = {
  cpp: new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
    'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
    'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
    'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
  ]),
  java: new Set([
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
    'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
    'extends', 'final', 'finally', 'float', 'for', 'if', 'implements', 'import',
    'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private',
    'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch',
    'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
  ]),
  python: new Set([
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
    'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for',
    'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
    'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
  ])
}

/**
 * Check if a word is a keyword in the given language
 */
function isKeyword(word: string, language: 'cpp' | 'java' | 'python'): boolean {
  return KEYWORDS[language].has(word)
}

/**
 * Remove comments from code
 */
function removeComments(code: string, language: 'cpp' | 'java' | 'python'): string {
  switch (language) {
    case 'cpp':
    case 'java':
      // Remove C-style block comments and line comments
      return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
        .replace(/\/\/.*/g, '')           // Line comments
    case 'python':
      // Remove Python comments (both # and docstrings)
      return code
        .replace(/"""[\s\S]*?"""/g, '')  // Triple-quoted strings
        .replace(/'''[\s\S]*?'''/g, '')   // Triple-quoted strings
        .replace(/#.*/g, '')              // Line comments
    default:
      return code
  }
}

/**
 * Tokenize normalized code into a sequence of structure-preserving tokens
 */
function tokenize(normalizedCode: string): NormalizedToken[] {
  const tokens: NormalizedToken[] = []
  const words = normalizedCode.split(/(\s+|\(|\)|\{|\}|\[|\]|;|,|\+|-|\*|\/|%|=|<|>|!|&|\|)/)

  for (const word of words) {
    const trimmed = word.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('ID_')) {
      tokens.push({ type: 'identifier', value: trimmed })
    } else if (trimmed === 'NUM_LITERAL' || trimmed === 'STR_LITERAL') {
      tokens.push({ type: 'literal', value: trimmed })
    } else if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
      tokens.push({ type: 'keyword', value: trimmed })
    } else if (/^[(){}\[\];,]$/.test(trimmed)) {
      tokens.push({ type: 'structure', value: trimmed })
    } else {
      tokens.push({ type: 'operator', value: trimmed })
    }
  }

  return tokens
}

/**
 * Calculate similarity score between two token sequences using
 * the Longest Common Subsequence (LCS) algorithm
 */
function calculateSimilarity(tokens1: NormalizedToken[], tokens2: NormalizedToken[]): number {
  const m = tokens1.length
  const n = tokens2.length

  // Create DP table
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tokensEqual(tokens1[i-1], tokens2[j-1])) {
        dp[i][j] = dp[i-1][j-1] + 1
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1])
      }
    }
  }

  // Calculate similarity score (0 to 1)
  const lcsLength = dp[m][n]
  return (2 * lcsLength) / (m + n)  // Dice coefficient
}

/**
 * Compare two tokens for equality
 */
function tokensEqual(t1: NormalizedToken, t2: NormalizedToken): boolean {
  return t1.type === t2.type && t1.value === t2.value
}

/**
 * Check code similarity between two submissions
 */
export function checkSimilarity(
  code1: string,
  code2: string,
  language: 'cpp' | 'java' | 'python'
): { similarityScore: number } {
  // Normalize both code samples
  const normalized1 = normalizeCode(code1, language)
  const normalized2 = normalizeCode(code2, language)

  // Tokenize normalized code
  const tokens1 = tokenize(normalized1)
  const tokens2 = tokenize(normalized2)

  // Calculate similarity score
  const similarityScore = calculateSimilarity(tokens1, tokens2)

  return { similarityScore }
}