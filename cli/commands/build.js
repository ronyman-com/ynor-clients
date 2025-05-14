import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import { checkDependencies } from './check.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define default configuration at the top level
const DEFAULT_CONFIG = {
    entryPoint: path.join(__dirname, '../../src/browsers/layouts/index.js'),
    componentsDir: path.join(__dirname, '../../src/browsers/layouts/pages'),
    outputDir: path.join(process.cwd(), '/dist'),
    htmlTemplate: path.join(__dirname, '../../src/browsers/layouts/pages/home.html'),
    nodePaths: [path.join(__dirname, '../../node_modules')]
};

export async function buildCommand(args = []) {
    // Initialize config with defaults
    const config = {
        ...DEFAULT_CONFIG,
        ...parseBuildArgs(args) // Add this function to handle CLI args
    };

    try {
        // Verify source files exist
        await verifyFilesExist(config);

        // Check dependencies - now properly using the config object
        const dependencyReport = await checkDependencies(config.entryPoint);
        console.log('Dependency check completed:', {
            entry: config.entryPoint,
            found: dependencyReport.imports.length,
            errors: dependencyReport.errors.length
        });

        // Bundle JavaScript
        const jsOutputPath = path.join(config.outputDir, 'bundle.js');
        await bundleJavaScript(config, jsOutputPath, args);

        // Render HTML
        const htmlContent = await renderHtmlTemplate({
            templatePath: config.htmlTemplate,
            jsBundlePath: '/dist/bundle.js',
            dependencies: dependencyReport.imports
        });

        // Write output
        await writeOutput(config.outputDir, htmlContent);

        return {
            success: true,
            stats: {
                dependencies: dependencyReport.imports.length,
                outputSize: await getFileSize(jsOutputPath)
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

// Helper functions
async function verifyFilesExist(config) {
    await Promise.all([
        fs.access(config.entryPoint),
        fs.access(config.htmlTemplate)
    ]);
}

async function bundleJavaScript(config, outputPath, args) {
    await esbuild.build({
        entryPoints: [config.entryPoint],
        bundle: true,
        outfile: outputPath,
        format: 'esm',
        minify: !args.includes('--dev'),
        sourcemap: args.includes('--dev'),
        loader: {
            '.html': 'text',
            '.css': 'css'
        },
        nodePaths: config.nodePaths,
        logLevel: 'info'
    });
}

async function renderHtmlTemplate({ templatePath, jsBundlePath, dependencies }) {
    const html = await fs.readFile(templatePath, 'utf-8');
    return html.replace(
        '<!-- SCRIPTS -->',
        `<script type="module" src="${jsBundlePath}"></script>`
    );
}

async function writeOutput(outputDir, htmlContent) {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'index.html'), htmlContent);
}

async function getFileSize(filePath) {
    const stats = await fs.stat(filePath);
    return `${(stats.size / 1024).toFixed(2)} KB`;
}

function parseBuildArgs(args) {
    return args.reduce((config, arg) => {
        if (arg === '--production') {
            config.minify = true;
            config.sourcemap = false;
        } else if (arg === '--dev') {
            config.minify = false;
            config.sourcemap = true;
        }
        return config;
    }, {});
}