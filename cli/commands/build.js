import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkDependencies } from './check.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildCommand(args = []) {
    try {
        const sourceFile = path.join(__dirname, '../../../src/browsers/layouts/index.js');
        const outputFile = path.join(process.cwd(), 'dist', 'index.html');
        
        // Verify source file exists
        await fs.access(sourceFile);
        
        // Check dependencies and referenced files
        const dependencyReport = await checkDependencies(sourceFile);
        
        // Read and process the source file
        let content = await fs.readFile(sourceFile, 'utf-8');
        
        // Simple compilation example (expand based on your needs)
        const compiledHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Ynor Browser</title>
    <script type="module">
        // Compiled from ${sourceFile}
        ${content}
    </script>
</head>
<body>
    <div id="root"></div>
    ${generateScriptTags(dependencyReport.imports)}
</body>
</html>
        `.trim();
        
        // Ensure output directory exists
        await fs.mkdir(path.dirname(outputFile), { recursive: true });
        
        // Write compiled output
        await fs.writeFile(outputFile, compiledHTML);
        
        console.log(`Successfully compiled to ${outputFile}`);
        console.log(`Dependencies processed: ${dependencyReport.imports.length}`);
        
        return {
            success: true,
            outputPath: outputFile,
            dependencies: dependencyReport,
            serverConfig: {
                staticDir: path.dirname(outputFile),
                routes: [{
                    method: 'get',
                    path: '/build-info',
                    handler: (req, res) => res.json(dependencyReport)
                }]
            }
        };
    } catch (error) {
        console.error('Build failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

function generateScriptTags(imports) {
    return imports.map(imp => 
        `<script src="${path.relative(process.cwd(), imp)}" type="module"></script>`
    ).join('\n    ');
}