import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer(config = {}) {
    const app = express();
    const port = config.port || 3000;

    // Development features setup
    if (config.mode === 'development') {
        setupDevelopmentFeatures(app, config);
    }

    // Static assets serving
    setupStaticAssets(app, config);

    // API routes
    setupRoutes(app, config);

    // Serve the main index.html from dist
    setupMainRoute(app, config);

    const server = app.listen(port, () => {
        console.log(`
Server running in ${config.mode} mode
- Local:    http://localhost:${port}
- Static:   ${config.staticDirs?.join('\n           ') || 'None'}
- Watching: ${config.watch ? config.watch.join('\n           ') : 'No'}
        `);
    });

    return server;
}

function setupDevelopmentFeatures(app, config) {
    if (config.liveReload) {
        const lrServer = livereload.createServer({
            exts: ['js', 'css', 'html'],
            debug: true
        });
        
        config.staticDirs?.forEach(dir => {
            if (fs.existsSync(dir)) {
                lrServer.watch(dir);
            }
        });
        app.use(connectLivereload());
    }

    if (config.watch) {
        const watcher = chokidar.watch(config.watch.filter(dir => fs.existsSync(dir)), {
            ignored: /node_modules/,
            awaitWriteFinish: true
        });
        
        watcher.on('change', path => {
            console.log(`[HMR] File changed: ${path}`);
        });
    }
}

function setupStaticAssets(app, config) {
    (config.staticDirs || []).forEach(dir => {
        if (fs.existsSync(dir)) {
            app.use(express.static(dir));
        } else {
            console.warn(`Static directory not found: ${dir}`);
        }
    });
}

function setupRoutes(app, config) {
    // Default routes
    const defaultRoutes = [
        {
            method: 'get',
            path: '/health',
            handler: (_, res) => res.json({ status: 'healthy' })
        },
        {
            method: 'get',
            path: '/config',
            handler: (_, res) => res.json({
                mode: config.mode,
                timestamp: new Date().toISOString()
            })
        }
    ];

    (config.routes || defaultRoutes).forEach(route => {
        app[route.method](route.path, route.handler);
    });
}

function setupMainRoute(app, config) {
    // Primary dist directory
    const distDir = config.distDir || path.join(process.cwd(), 'dist');
    const indexPath = path.join(distDir, 'index.html');

    // Serve index.html for all routes
    app.get('*', (req, res) => {
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(500).send(`
                <h1>Error: Could not find index.html</h1>
                <p>Expected to find it at: ${indexPath}</p>
                <p>Please run the build command first.</p>
            `);
        }
    });
}