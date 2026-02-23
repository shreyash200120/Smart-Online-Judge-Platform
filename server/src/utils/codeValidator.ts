import { isASCII } from './stringUtils'

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateJavaCode(sourceCode: string): ValidationResult {
    // Check for non-ASCII characters
    if (!isASCII(sourceCode)) {
        return {
            isValid: false,
            error: 'Code contains invalid characters. Only ASCII characters are allowed.'
        };
    }

    // Split code into lines and remove empty lines
    const lines = sourceCode.split('\n').map(line => line.trim()).filter(line => line);

    // Track current parsing state
    let foundImports = false;
    let foundClass = false;
    let foundMain = false;
    let inClassBody = false;
    let inMethodBody = false;
    let bracketCount = 0;

    // Check each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Only allow imports at the start
        if (line.startsWith('import ')) {
            if (foundClass) {
                return {
                    isValid: false,
                    error: `Import statement found after class declaration at line ${i + 1}`
                };
            }
            if (!line.endsWith(';')) {
                return {
                    isValid: false,
                    error: `Import statement missing semicolon at line ${i + 1}`
                };
            }
            foundImports = true;
            continue;
        }

        // Verify class declaration
        if (line.includes('class Main')) {
            if (!line.match(/^public\s+class\s+Main\s*\{$/)) {
                return {
                    isValid: false,
                    error: `Invalid class declaration at line ${i + 1}. Must be exactly 'public class Main {'`
                };
            }
            if (foundClass) {
                return {
                    isValid: false,
                    error: `Multiple class declarations found at line ${i + 1}`
                };
            }
            foundClass = true;
            inClassBody = true;
            bracketCount++;
            continue;
        }

        // Verify main method
        if (line.includes('main')) {
            if (!line.match(/^public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+args\s*\)\s*\{$/)) {
                return {
                    isValid: false,
                    error: `Invalid main method declaration at line ${i + 1}. Must be exactly 'public static void main(String[] args) {'`
                };
            }
            if (foundMain) {
                return {
                    isValid: false,
                    error: `Multiple main method declarations found at line ${i + 1}`
                };
            }
            if (!inClassBody) {
                return {
                    isValid: false,
                    error: `Main method declared outside class at line ${i + 1}`
                };
            }
            foundMain = true;
            inMethodBody = true;
            bracketCount++;
            continue;
        }

        // Count brackets
        bracketCount += (line.match(/\{/g) || []).length;
        bracketCount -= (line.match(/\}/g) || []).length;

        // Check for any text outside of valid code blocks
        if (!foundClass && !line.startsWith('import ') && line.trim() !== '') {
            return {
                isValid: false,
                error: `Invalid text before class declaration at line ${i + 1}`
            };
        }
    }

    // Final structure validation
    if (!foundClass) {
        return {
            isValid: false,
            error: 'Missing public class Main'
        };
    }
    if (!foundMain) {
        return {
            isValid: false,
            error: 'Missing main method'
        };
    }
    if (bracketCount !== 0) {
        return {
            isValid: false,
            error: bracketCount > 0 ? 'Missing closing braces' : 'Extra closing braces'
        };
    }

    // Check for balanced braces and parentheses
    const stack: string[] = [];
    for (const char of sourceCode) {
        if ('({['.includes(char)) {
            stack.push(char);
        } else if (')}]'.includes(char)) {
            const last = stack.pop();
            if (!last) {
                return {
                    isValid: false,
                    error: 'Unmatched closing bracket or parenthesis'
                };
            }
            if (
                (char === ')' && last !== '(') ||
                (char === '}' && last !== '{') ||
                (char === ']' && last !== '[')
            ) {
                return {
                    isValid: false,
                    error: 'Mismatched brackets or parentheses'
                };
            }
        }
    }

    if (stack.length > 0) {
        return {
            isValid: false,
            error: 'Unclosed brackets or parentheses'
        };
    }

    return { isValid: true };
}

export function validateCppCode(sourceCode: string): ValidationResult {
    // Check for non-ASCII characters
    if (!isASCII(sourceCode)) {
        return {
            isValid: false,
            error: 'Code contains invalid characters. Only ASCII characters are allowed.'
        };
    }

    // Split code into lines and remove empty lines
    const lines = sourceCode.split('\n').map(line => line.trim()).filter(line => line);

    // Track current parsing state
    let foundIncludes = false;
    let foundMain = false;
    let inMainBody = false;
    let bracketCount = 0;
    let inPreprocessor = false;

    // Check each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Only allow includes and using statements at the start
        if (line.startsWith('#include')) {
            if (foundMain) {
                return {
                    isValid: false,
                    error: `Include directive found after main function at line ${i + 1}`
                };
            }
            if (!line.match(/^#include\s*<[\w\.]+>$/) && !line.match(/^#include\s*"[\w\.]+\"$/)) {
                return {
                    isValid: false,
                    error: `Invalid include directive at line ${i + 1}`
                };
            }
            foundIncludes = true;
            continue;
        }

        if (line.startsWith('using')) {
            if (foundMain) {
                return {
                    isValid: false,
                    error: `Using statement found after main function at line ${i + 1}`
                };
            }
            if (!line.endsWith(';')) {
                return {
                    isValid: false,
                    error: `Using statement missing semicolon at line ${i + 1}`
                };
            }
            continue;
        }

        // Verify main function
        if (line.includes('main')) {
            if (!line.match(/^int\s+main\s*\(\s*(?:void)?\s*\)\s*\{$/)) {
                return {
                    isValid: false,
                    error: `Invalid main function declaration at line ${i + 1}. Must be 'int main()' or 'int main(void)'`
                };
            }
            if (foundMain) {
                return {
                    isValid: false,
                    error: `Multiple main function declarations found at line ${i + 1}`
                };
            }
            foundMain = true;
            inMainBody = true;
            bracketCount++;
            continue;
        }

        // Count brackets
        bracketCount += (line.match(/\{/g) || []).length;
        bracketCount -= (line.match(/\}/g) || []).length;

        // Check for any text outside of valid code blocks
        if (!foundMain && !line.startsWith('#') && !line.startsWith('using') && line.trim() !== '') {
            return {
                isValid: false,
                error: `Invalid text before main function at line ${i + 1}`
            };
        }
    }

    // Final structure validation
    if (!foundIncludes) {
        return {
            isValid: false,
            error: 'Missing #include directive'
        };
    }
    if (!foundMain) {
        return {
            isValid: false,
            error: 'Missing main function'
        };
    }
    if (bracketCount !== 0) {
        return {
            isValid: false,
            error: bracketCount > 0 ? 'Missing closing braces' : 'Extra closing braces'
        };
    }

    // Check for balanced braces and parentheses
    const stack: string[] = [];
    for (const char of sourceCode) {
        if ('({['.includes(char)) {
            stack.push(char);
        } else if (')}]'.includes(char)) {
            const last = stack.pop();
            if (!last) {
                return {
                    isValid: false,
                    error: 'Unmatched closing bracket or parenthesis'
                };
            }
            if (
                (char === ')' && last !== '(') ||
                (char === '}' && last !== '{') ||
                (char === ']' && last !== '[')
            ) {
                return {
                    isValid: false,
                    error: 'Mismatched brackets or parentheses'
                };
            }
        }
    }

    if (stack.length > 0) {
        return {
            isValid: false,
            error: 'Unclosed brackets or parentheses'
        };
    }

    return { isValid: true };
}