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
    const dependencyGraph = new Map();
    const errors = [];
    
    async function analyzeFile(currentPath) {
        if (dependencyGraph.has(currentPath)) return;
        
        const imports = [];
        dependencyGraph.set(currentPath, imports);
        
        try {
            const content = await fs.readFile(currentPath, 'utf-8');
            const ast = parse(content, {
                sourceType: 'module',
                ecmaVersion: 'latest'
            });
            
            for (const node of ast.body) {
                if (node.type === 'ImportDeclaration') {
                    const importPath = node.source.value;
                    try {
                        const resolvedPath = await resolveImportPath(currentPath, importPath);
                        imports.push(resolvedPath);
                        await analyzeFile(resolvedPath);
                    } catch (err) {
                        errors.push({
                            file: currentPath,
                            import: importPath,
                            error: err.message
                        });
                    }
                }
            }
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
        imports: Array.from(dependencyGraph.keys()).filter(k => k !== path.resolve(filePath)),
        dependencyGraph: Object.fromEntries(dependencyGraph),
        errors,
        valid: errors.length === 0,
        generatedAt: new Date().toISOString()
    };
}

// Change resolveImportPath to be async
async function resolveImportPath(baseFile, importPath) {
    // Handle relative paths
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const fullPath = path.resolve(path.dirname(baseFile), importPath);
        
        // Check for exact match
        try {
            await fs.access(fullPath);
            return fullPath;
        } catch {
            // Try with .js extension
            try {
                await fs.access(`${fullPath}.js`);
                return `${fullPath}.js`;
            } catch {
                // Try index.js in directory
                try {
                    await fs.access(path.join(fullPath, 'index.js'));
                    return path.join(fullPath, 'index.js');
                } catch {
                    throw new Error(`Cannot resolve import: ${importPath}`);
                }
            }
        }
    }
    
    // Handle node_modules
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