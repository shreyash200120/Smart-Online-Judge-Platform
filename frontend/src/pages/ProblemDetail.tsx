import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { api } from '../lib/api'
import { useState, useRef, useEffect } from 'react'

const fetcher = (url: string) => api.get(url).then(r=>r.data)

export default function ProblemDetail() {
        const { id } = useParams()
        const { data: p, error, isLoading } = useSWR(id ? `/problems/${id}` : null, fetcher)
        const [language, setLanguage] = useState<'cpp'|'java'>('cpp')
        const [source, setSource] = useState('')
        const [msg, setMsg] = useState<string | null>(null)
        const [isSubmitting, setIsSubmitting] = useState(false)

        // Default code templates
        const getDefaultCode = (lang: string) => {
                if (lang === 'cpp') {
                        return `#include <iostream>
using namespace std;

int main() {
    // Your code here

    return 0;
}`
                } else if (lang === 'java') {
                        return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Your code here

    }
}`
                }
                return ''
        }

        // Update source code when language changes
        const handleLanguageChange = (newLang: 'cpp'|'java') => {
                setLanguage(newLang)
                if (!source.trim() || source === getDefaultCode(language)) {
                        setSource(getDefaultCode(newLang))
                }
        }

        // Validation
        function validateCode(code: string, language: string, problemTitle: string): { isValid: boolean, error: string } {
                console.log('Validation started')
                console.log('Code:', code.substring(0, 100) + '...')
                console.log('Language:', language)
                console.log('Problem:', problemTitle)

                if (!code.trim()) {
                        return { isValid: false, error: 'Please write some code before submitting' }
                }

                // Check for invalid characters that might cause compilation issues
                const invalidChars = code.match(/[^\x00-\x7F]+/g)
                if (invalidChars) {
                        return { isValid: false, error: `Invalid characters detected: ${invalidChars.join(', ')}` }
                }

                // Basic structural checks
                if (language === 'cpp') {
                        if (!code.includes('#include')) {
                                return { isValid: false, error: 'Missing #include directive' }
                        }
                        if (!code.includes('int main()') && !code.includes('int main(void)')) {
                                return { isValid: false, error: 'Missing main function. Must be declared as int main() or int main(void)' }
                        }
                        if (!code.includes('return 0') && !code.includes('return 0;')) {
                                return { isValid: false, error: 'Missing return statement in main function' }
                        }
                } else if (language === 'java') {
                        if (!code.match(/public\s+class\s+Main\s*\{/)) {
                                return { isValid: false, error: 'Missing or incorrectly formatted public class Main' }
                        }
                        if (!code.match(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*args\s*\)\s*\{/)) {
                                return { isValid: false, error: 'Missing or incorrectly formatted main method. Must be: public static void main(String[] args)' }
                        }
                }

                // Check for balanced brackets and parentheses
                const brackets: { [key: string]: string } = {
                        '(': ')',
                        '{': '}',
                        '[': ']'
                }
                const stack: string[] = []
                const lines = code.split('\n')
                for (let i = 0; i < code.length; i++) {
                        const char = code[i]
                        if ('({['.includes(char)) {
                                stack.push(char)
                        } else if (')}]'.includes(char)) {
                                const last = stack.pop()
                                const expectedClose = last ? brackets[last] : undefined
                                if (!last || expectedClose !== char) {
                                        return { isValid: false, error: `Mismatched brackets near position ${i}` }
                                }
                        }
                }
                if (stack.length > 0) {
                        return { isValid: false, error: `Unclosed brackets: missing ${stack.length} closing bracket(s)` }
                }

                // Line by line validation
                for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim()
                        const lineNum = i + 1

                        // Skip comments and certain declarations
                        if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || 
                            line.startsWith('import') || line.startsWith('@') || line.startsWith('}')) {
                                continue
                        }

                        // Check for common Java-specific errors
                        if (language === 'java') {
                                // Check for missing semicolons
                                if (line.match(/^(?!.*[{}\s]$)(?!.*\s*for\s*\()(?!.*\s*if\s*\()(?!.*\s*while\s*\().*$/)) {
                                        if (!line.endsWith(';')) {
                                                return { isValid: false, error: `Missing semicolon on line ${lineNum}: "${line}"` }
                                        }
                                }

                                // Check Scanner initialization
                                if (line.includes('Scanner') && !line.includes('System.in')) {
                                        return { isValid: false, error: `Invalid Scanner initialization on line ${lineNum}. Use: Scanner sc = new Scanner(System.in)` }
                                }

                                // Check for common method call errors
                                if (line.includes('nextInt(;') || line.includes('println(;')) {
                                        return { isValid: false, error: `Invalid method call on line ${lineNum}: "${line}" - semicolon inside parentheses` }
                                }
                        }

                        // Check for common C++ specific errors
                        if (language === 'cpp') {
                                if (line.includes('cin') && !line.includes('>>')) {
                                        return { isValid: false, error: `Invalid input operation on line ${lineNum}. Use >> for input` }
                                }
                                if (line.includes('cout') && !line.includes('<<')) {
                                        return { isValid: false, error: `Invalid output operation on line ${lineNum}. Use << for output` }
                                }
                        }
                }

                // Problem-specific validation
                if (problemTitle === 'A + B') {
                        // Check for basic I/O operations
                        if (language === 'cpp') {
                                if (!code.includes('cin')) {
                                        return { isValid: false, error: 'Missing input operation (cin)' }
                                }
                                if (!code.includes('cout')) {
                                        return { isValid: false, error: 'Missing output operation (cout)' }
                                }
                                // Check for common C++ I/O mistakes
                                if (code.includes('cin >>') && !code.match(/cin\s*>>\s*[a-zA-Z]/)) {
                                        return { isValid: false, error: 'Invalid input format. Use: cin >> variableName' }
                                }
                                if (code.includes('cout <<') && !code.match(/cout\s*<<\s*[a-zA-Z]/)) {
                                        return { isValid: false, error: 'Invalid output format. Use: cout << result' }
                                }
                        } else if (language === 'java') {
                                if (!code.includes('Scanner')) {
                                        return { isValid: false, error: 'Missing Scanner for input' }
                                }
                                if (!code.match(/Scanner\s+\w+\s*=\s*new\s+Scanner\s*\(\s*System\.in\s*\)/)) {
                                        return { isValid: false, error: 'Invalid Scanner initialization. Use: Scanner sc = new Scanner(System.in)' }
                                }
                                if (!code.includes('System.out.println')) {
                                        return { isValid: false, error: 'Missing output operation (System.out.println)' }
                                }
                                if (!code.includes('nextInt()')) {
                                        return { isValid: false, error: 'Missing nextInt() method to read integers' }
                                }
                                // Check for common Java mistakes
                                if (code.includes('System.in.read')) {
                                        return { isValid: false, error: 'Do not use System.in.read(). Use Scanner for input' }
                                }
                        }

                        // Check for arithmetic operation correctness
                        if (code.includes('a - b') || code.includes('a-b') || /[a-zA-Z]\s*-\s*[a-zA-Z]/.test(code)) {
                                return { isValid: false, error: 'Wrong Answer: You are subtracting instead of adding' }
                        }
                        if (code.includes('a * b') || code.includes('a*b') || /[a-zA-Z]\s*\*\s*[a-zA-Z]/.test(code)) {
                                return { isValid: false, error: 'Wrong Answer: You are multiplying instead of adding' }
                        }
                        if (code.includes('a / b') || code.includes('a/b') || /[a-zA-Z]\s*\/\s*[a-zA-Z]/.test(code)) {
                                return { isValid: false, error: 'Wrong Answer: You are dividing instead of adding' }
                        }

                        // Check for proper addition
                        const hasProperAddition = language === 'cpp' 
                                ? code.match(/[a-zA-Z]\s*\+\s*[a-zA-Z]/) || code.match(/cout\s*<<\s*[a-zA-Z]\s*\+\s*[a-zA-Z]/)
                                : code.match(/[a-zA-Z]\s*\+\s*[a-zA-Z]/) || code.match(/System\.out\.println\s*\(\s*[a-zA-Z]\s*\+\s*[a-zA-Z]\s*\)/);

                        if (!hasProperAddition) {
                                return { isValid: false, error: 'Cannot find proper addition of two variables' }
                        }

                        // Check for variable declarations
                        if (language === 'java') {
                                if (!code.match(/int\s+[a-zA-Z]/)) {
                                        return { isValid: false, error: 'Missing integer variable declarations' }
                                }
                                // Check Scanner close
                                if (!code.includes('.close()')) {
                                        return { isValid: false, error: 'Remember to close the Scanner using .close()' }
                                }
                        } else if (language === 'cpp') {
                                if (!code.match(/int\s+[a-zA-Z]/)) {
                                        return { isValid: false, error: 'Missing integer variable declarations' }
                                }
                        }
                }

                return { isValid: true, error: '' }
        }

        async function submit(e: React.FormEvent) {
                e.preventDefault()
                setMsg(null)
                setIsSubmitting(true)

                console.log('Submit button clicked')
                console.log('Source code:', source)
                console.log('Language:', language)
                console.log('Problem title:', p?.title)

                // Validate code before submission
                const validation = validateCode(source, language, p?.title || '')

                if (!validation.isValid) {
                        setMsg(`❌ ${validation.error}`)
                        setIsSubmitting(false)
                        return
                }

                try {
                        const { data } = await api.post('/submissions', { problemId: id, language, sourceCode: source })
                        setMsg(`✅ Submitted #${data._id}`)
                        setSource('')
                } catch (e: any) {
                        console.error('Submission error:', e)
                        setMsg(`❌ Submission failed: ${e?.response?.data?.detail || 'Unknown error'}`)
                } finally {
                        setIsSubmitting(false)
                }
        }

        if (isLoading) return (
                <div style={{
                        textAlign: 'center',
                        padding: '50px',
                        color: '#e0e0e0',
                        fontSize: '18px'
                }}>
                        Loading problem...
                </div>
        )

        if (error) return (
                <div style={{
                        textAlign: 'center',
                        padding: '50px',
                        color: '#ff6b6b',
                        fontSize: '18px'
                }}>
                        Error loading problem: {error.message}
                </div>
        )

        if (!p) return null

        return (
                <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '20px'
                }}>
                        <div style={{
                                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                                border: '1px solid rgba(78, 205, 196, 0.3)',
                                borderRadius: '16px',
                                padding: '30px',
                                marginBottom: '30px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                        }}>
                                <h2 style={{
                                        color: '#4ECDC4',
                                        margin: '0 0 20px 0',
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}>
                                        {p.title}
                                </h2>
                                <p style={{
                                        color: '#e0e0e0',
                                        margin: '0 0 20px 0',
                                        lineHeight: '1.6',
                                        fontSize: '16px'
                                }}>
                                        {p.description}
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                                <h4 style={{
                                                        color: '#4ECDC4',
                                                        margin: '0 0 10px 0',
                                                        fontSize: '18px',
                                                        fontWeight: '600'
                                                }}>
                                                        📥 Input Format
                                                </h4>
                                                <pre style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        color: '#e0e0e0',
                                                        fontSize: '14px',
                                                        overflow: 'auto',
                                                        border: '1px solid rgba(78, 205, 196, 0.2)',
                                                        fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                                                }}>
                                                        {p.inputFormat}
                                                </pre>
                                        </div>
                                        <div>
                                                <h4 style={{
                                                        color: '#4ECDC4',
                                                        margin: '0 0 10px 0',
                                                        fontSize: '18px',
                                                        fontWeight: '600'
                                                }}>
                                                        📤 Output Format
                                                </h4>
                                                <pre style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        color: '#e0e0e0',
                                                        fontSize: '14px',
                                                        overflow: 'auto',
                                                        border: '1px solid rgba(78, 205, 196, 0.2)',
                                                        fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                                                }}>
                                                        {p.outputFormat}
                                                </pre>
                                        </div>
                                </div>

                                <div style={{
                                        display: 'flex',
                                        gap: '20px',
                                        marginTop: '20px',
                                        fontSize: '14px',
                                        color: '#888'
                                }}>
                                        <span>⏱️ Time Limit: {p.timeLimitMs}ms</span>
                                        <span>💾 Memory Limit: {p.memoryLimitMb}MB</span>
                                </div>
                        </div>

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
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}>
                                        💻 Submit Solution
                                </h3>

                                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {msg && (
                                                <div style={{
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        textAlign: 'center',
                                                        background: msg.includes('✅')
                                                                ? 'rgba(76, 175, 80, 0.2)'
                                                                : 'rgba(244, 67, 54, 0.2)',
                                                        border: `1px solid ${msg.includes('✅') ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'}`,
                                                        color: msg.includes('✅') ? '#4CAF50' : '#f44336'
                                                }}>
                                                        {msg}
                                                </div>
                                        )}

                                        <div>
                                                <label style={{
                                                        color: '#e0e0e0',
                                                        display: 'block',
                                                        marginBottom: '8px',
                                                        fontWeight: '600',
                                                        fontSize: '16px'
                                                }}>
                                                        Language:
                                                </label>
                                                <select
                                                        value={language}
                                                        onChange={e => handleLanguageChange(e.target.value as any)}
                                                        style={{
                                                                background: 'rgba(0,0,0,0.4)',
                                                                border: '1px solid rgba(78, 205, 196, 0.3)',
                                                                borderRadius: '8px',
                                                                padding: '10px 15px',
                                                                color: '#e0e0e0',
                                                                fontSize: '16px',
                                                                outline: 'none',
                                                                width: '200px',
                                                                cursor: 'pointer'
                                                        }}
                                                >
                                                        <option value="cpp">C++</option>
                                                        <option value="java">Java</option>
                                                </select>
                                        </div>

                                        <div>
                                                <label style={{
                                                        color: '#e0e0e0',
                                                        display: 'block',
                                                        marginBottom: '8px',
                                                        fontWeight: '600',
                                                        fontSize: '16px'
                                                }}>
                                                        Source Code:
                                                </label>
                                                <div style={{
                                                        border: '1px solid rgba(78, 205, 196, 0.3)',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                                        position: 'relative'
                                                }}>
                                                        {/* Line Numbers */}
                                                        <div style={{
                                                                position: 'absolute',
                                                                left: '0',
                                                                top: '0',
                                                                width: '50px',
                                                                height: '400px',
                                                                background: 'rgba(0,0,0,0.6)',
                                                                borderRight: '1px solid rgba(78, 205, 196, 0.2)',
                                                                color: '#888',
                                                                fontSize: '14px',
                                                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                                padding: '15px 5px',
                                                                lineHeight: '20px',
                                                                userSelect: 'none',
                                                                zIndex: 1
                                                        }}>
                                                                {Array.from({ length: Math.max(20, (source || getDefaultCode(language)).split('\n').length) }, (_, i) => (
                                                                        <div key={i} style={{ textAlign: 'right', paddingRight: '5px' }}>
                                                                                {i + 1}
                                                                        </div>
                                                                ))}
                                                        </div>

                                                        {/* Code Editor */}
                                                        <textarea
                                                                value={source || getDefaultCode(language)}
                                                                onChange={(e) => setSource(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                        if (e.key === 'Tab') {
                                                                                e.preventDefault()
                                                                                const textarea = e.target as HTMLTextAreaElement
                                                                                const start = textarea.selectionStart
                                                                                const end = textarea.selectionEnd
                                                                                const value = textarea.value
                                                                                const newValue = value.substring(0, start) + '    ' + value.substring(end)
                                                                                setSource(newValue)

                                                                                setTimeout(() => {
                                                                                        textarea.selectionStart = textarea.selectionEnd = start + 4
                                                                                }, 0)
                                                                        }
                                                                }}
                                                                style={{
                                                                        width: '100%',
                                                                        height: '400px',
                                                                        background: 'rgba(0,0,0,0.8)',
                                                                        border: 'none',
                                                                        padding: '15px 15px 15px 65px',
                                                                        color: '#e0e0e0',
                                                                        fontSize: '14px',
                                                                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                                        outline: 'none',
                                                                        resize: 'none',
                                                                        boxSizing: 'border-box',
                                                                        lineHeight: '20px',
                                                                        tabSize: 4,
                                                                        whiteSpace: 'pre',
                                                                        overflow: 'auto'
                                                                }}
                                                                placeholder="Enter your code here..."
                                                                spellCheck={false}
                                                        />
                                                </div>
                                        </div>

                                        <button
                                                type="submit"
                                                disabled={isSubmitting || !source.trim()}
                                                style={{
                                                        background: isSubmitting || !source.trim()
                                                                ? 'rgba(255,255,255,0.3)'
                                                                : 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '15px 30px',
                                                        borderRadius: '8px',
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        cursor: isSubmitting || !source.trim() ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px',
                                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                                        alignSelf: 'flex-start'
                                                }}
                                                onMouseEnter={(e) => {
                                                        if (!isSubmitting && source.trim()) {
                                                                e.currentTarget.style.transform = 'translateY(-2px)'
                                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
                                                        }
                                                }}
                                                onMouseLeave={(e) => {
                                                        if (!isSubmitting && source.trim()) {
                                                                e.currentTarget.style.transform = 'translateY(0)'
                                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'
                                                        }
                                                }}
                                        >
                                                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                                        </button>
                                </form>
                        </div>
                </div>
        )
}