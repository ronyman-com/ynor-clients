import express from 'express';
import path from 'path';
import chokidar from 'chokidar';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';
import fs from 'fs';
import os from 'os';


export async function startServer(config = {}) {
    const app = express();
    const port = config.port || 3000;

    // 1. First setup static assets
    setupStaticAssets(app, config);

    // 2. Then setup API routes
    setupRoutes(app);

    // 3. Finally setup the main SPA route
    setupMainRoute(app, config);

    return new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
            console.log(`\nServer running:\n- Local:   http://localhost:${port}`);
            
            const networkUrl = getNetworkUrl(port);
            if (networkUrl) {
                console.log(`- Network: ${networkUrl}`);
            }
            
            resolve(server);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                reject(new Error(`Port ${port} is already in use`));
            } else {
                reject(err);
            }
        });
    });
}

function setupStaticAssets(app, config) {
    // Serve static files from all specified directories
    (config.staticDirs || []).forEach(dir => {
        if (fs.existsSync(dir)) {
            app.use(express.static(dir, { index: false })); // Important: disable automatic index.html serving
        }
    });
}

function setupRoutes(app) {
    // API routes
    app.get('/health', (_, res) => res.json({ status: 'healthy' }));
    app.get('/config', (_, res) => res.json({ status: 'ok' }));
}

function setupMainRoute(app, config) {
    // Main SPA route handler
    app.get('*', (req, res) => {
        const indexPath = path.join(config.distDir, 'index.html');
        
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(500).send(`
                <h1>Application Error</h1>
                <p>Could not find index.html at: ${indexPath}</p>
                <p>Please run the build command first.</p>
            `);
        }
    });
}

// Helper function to get network URL
function getNetworkUrl(port) {
    try {
        const interfaces = os.networkInterfaces();
        for (const name in interfaces) {
            for (const net of interfaces[name]) {
                const isIPv4 = net.family === 'IPv4' || net.family === 4;
                if (isIPv4 && !net.internal) {
                    return `http://${net.address}:${port}`;
                }
            }
        }
    } catch (e) {
        console.error('Network detection error:', e);
    }
    return null;
}