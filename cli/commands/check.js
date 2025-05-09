import fs from 'fs/promises';
import path from 'path';
import { parse } from 'acorn';
import { walk } from 'estree-walker';

/**
 * Check file dependencies and validate the project structure
 * @param {string} filePath - Path to the entry file to check
 * @returns {Promise<Object>} Dependency report
 */
export async function checkDependencies(filePath) {
    const checkedFiles = new Set();
    const imports = [];
    const errors = [];
    
    async function analyzeFile(currentPath) {
        if (checkedFiles.has(currentPath)) return;
        checkedFiles.add(currentPath);
        
        try {
            const content = await fs.readFile(currentPath, 'utf-8');
            const ast = parse(content, {
                sourceType: 'module',
                ecmaVersion: 'latest'
            });
            
            walk(ast, {
                enter(node) {
                    if (node.type === 'ImportDeclaration') {
                        const importPath = node.source.value;
                        try {
                            const resolvedPath = resolveImportPath(currentPath, importPath);
                            imports.push(resolvedPath);
                            analyzeFile(resolvedPath);
                        } catch (err) {
                            errors.push({
                                file: currentPath,
                                import: importPath,
                                error: err.message
                            });
                        }
                    }
                }
            });
        } catch (error) {
            errors.push({
                file: currentPath,
                error: error.message
            });
        }
    }
    
    await analyzeFile(path.resolve(filePath));
    
    return {
        entry: filePath,
        imports: Array.from(new Set(imports)),
        checkedFiles: Array.from(checkedFiles),
        errors,
        valid: errors.length === 0,
        generatedAt: new Date().toISOString()
    };
}

function resolveImportPath(baseFile, importPath) {
    // Handle relative paths
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const fullPath = path.resolve(path.dirname(baseFile), importPath);
        
        // Check for exact match
        if (fs.existsSync(fullPath)) return fullPath;
        
        // Try with .js extension
        if (fs.existsSync(`${fullPath}.js`)) return `${fullPath}.js`;
        
        // Try index.js in directory
        if (fs.existsSync(path.join(fullPath, 'index.js'))) {
            return path.join(fullPath, 'index.js');
        }
        
        throw new Error(`Cannot resolve import: ${importPath}`);
    }
    
    // Handle node_modules (simplified)
    return importPath;
}

/**
 * CLI Command Entry Point
 * @param {Array} args - Command line arguments
 */
export async function checkCommand(args = []) {
    const entryFile = args[0] || 
        path.join(process.cwd(), 'src', 'browsers', 'layouts', 'index.js');
    
    console.log(`Checking dependencies for: ${entryFile}`);
    
    try {
        const report = await checkDependencies(entryFile);
        
        if (report.errors.length > 0) {
            console.error('Dependency check found issues:');
            report.errors.forEach(err => {
                console.error(`• ${err.file}: ${err.error}`);
                if (err.import) console.error(`  → Import: ${err.import}`);
            });
            process.exitCode = 1;
        } else {
            console.log('✓ All dependencies are valid');
            console.log(`✓ Checked ${report.checkedFiles.length} files`);
        }
        
        return report;
    } catch (error) {
        console.error('Check failed:', error.message);
        process.exitCode = 1;
        return {
            success: false,
            error: error.message
        };
    }
}