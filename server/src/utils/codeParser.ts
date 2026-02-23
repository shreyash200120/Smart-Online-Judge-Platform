interface ParsedJavaCode {
    imports: string[];
    className: string;
    mainMethod: string;
    codeBody: string;
    isValid: boolean;
    error?: string;
}

export function parseJavaCode(sourceCode: string): ParsedJavaCode {
    const result: ParsedJavaCode = {
        imports: [],
        className: '',
        mainMethod: '',
        codeBody: '',
        isValid: false
    };

    try {
        // Remove any BOM or invalid characters
        const cleanCode = sourceCode.replace(/^\uFEFF/, '').replace(/[^\x00-\x7F]/g, '');
        
        // Extract valid Java code using regex
        const importPattern = /^\s*import\s+[a-zA-Z0-9_.]+\s*;\s*$/gm;
        const classPattern = /public\s+class\s+Main\s*\{([^}]+)\}/;
        const mainPattern = /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+args\s*\)\s*\{([^}]+)\}/;

        // Extract imports
        const imports = cleanCode.match(importPattern) || [];
        result.imports = imports.map(imp => imp.trim());

        // Extract class and main method
        const classMatch = cleanCode.match(classPattern);
        if (!classMatch) {
            result.isValid = false;
            result.error = 'Could not find valid public class Main';
            return result;
        }

        const mainMatch = classMatch[1].match(mainPattern);
        if (!mainMatch) {
            result.isValid = false;
            result.error = 'Could not find valid main method';
            return result;
        }

        // Reconstruct valid code
        const validCode = [
            ...result.imports,
            '',
            'public class Main {',
            '    public static void main(String[] args) {',
            mainMatch[1].split('\n').map(line => '        ' + line.trim()).join('\n'),
            '    }',
            '}'
        ].join('\n');

        result.codeBody = validCode;
        result.isValid = true;
        return result;
    } catch (err) {
        result.isValid = false;
        result.error = 'Failed to parse Java code: ' + (err as Error).message;
        return result;
    }
}

interface ParsedCppCode {
    includes: string[];
    usingStatements: string[];
    mainFunction: string;
    codeBody: string;
    isValid: boolean;
    error?: string;
}

export function parseCppCode(sourceCode: string): ParsedCppCode {
    const result: ParsedCppCode = {
        includes: [],
        usingStatements: [],
        mainFunction: '',
        codeBody: '',
        isValid: false
    };

    try {
        // Remove any BOM or invalid characters
        const cleanCode = sourceCode.replace(/^\uFEFF/, '').replace(/[^\x00-\x7F]/g, '');
        
        // Extract valid C++ code using regex
        const includePattern = /^\s*#include\s*<[a-zA-Z0-9_.]+>\s*$/gm;
        const usingPattern = /^\s*using\s+[a-zA-Z0-9_.:]+\s*;\s*$/gm;
        const mainPattern = /int\s+main\s*\(\s*(?:void)?\s*\)\s*\{([^}]+)\}/;

        // Extract includes and using statements
        const includes = cleanCode.match(includePattern) || [];
        const usings = cleanCode.match(usingPattern) || [];
        
        result.includes = includes.map(inc => inc.trim());
        result.usingStatements = usings.map(use => use.trim());

        // Extract main function
        const mainMatch = cleanCode.match(mainPattern);
        if (!mainMatch) {
            result.isValid = false;
            result.error = 'Could not find valid main function';
            return result;
        }

        // Reconstruct valid code
        const validCode = [
            ...result.includes,
            '',
            ...result.usingStatements,
            '',
            'int main() {',
            mainMatch[1].split('\n').map(line => '    ' + line.trim()).join('\n'),
            '    return 0;',
            '}'
        ].join('\n');

        result.codeBody = validCode;
        result.isValid = true;
        return result;
    } catch (err) {
        result.isValid = false;
        result.error = 'Failed to parse C++ code: ' + (err as Error).message;
        return result;
    }
}