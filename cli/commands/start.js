import path from 'path';
import { fileURLToPath } from 'url';
import { startServer } from '../../server.js';
import { buildCommand } from './build.js';
import os from 'os';
import process from 'process';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startCommand(args = []) {
    const options = parseArgs(args);
    const env = options.env || 'development';
    
    try {
        if (env === 'development') {
            console.log('Building YNOR browser in development mode...');
            await buildCommand(['--dev']);
        }

        // Calculate absolute paths for static directories
        const projectRoot = path.join(__dirname, '../../');
        const staticDirs = [
            path.join(projectRoot, 'dist'),  // Primary dist directory
            path.join(projectRoot, 'public'),
            path.join(projectRoot, 'core', 'dist')
        ].filter(dir => {
            try {
                return fs.existsSync(dir);
            } catch (e) {
                console.warn(`Static directory not found: ${dir}`);
                return false;
            }
        });

        const server = await startServer({
            mode: env,
            port: options.port || 3000,
            staticDirs,
            distDir: path.join(projectRoot, 'dist'),  // Explicitly specify dist directory
            liveReload: env === 'development',
            watch: env === 'development' ? [
                path.join(projectRoot, 'src'),
                path.join(projectRoot, 'core', 'src')
            ] : false
        });

        return {
            server,
            urls: {
                local: `http://localhost:${server.address().port}`,
                network: getNetworkUrl(server.address().port)
            }
        };
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

function parseArgs(args) {
    return args.reduce((opts, arg) => {
        if (arg.startsWith('--port=')) {
            opts.port = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--env=')) {
            opts.env = arg.split('=')[1];
        } else if (arg === '--production') {
            opts.env = 'production';
        }
        return opts;
    }, { env: 'development' });
}

function generateRoutes() {
    return [
        {
            method: 'get',
            path: '/health',
            handler: (req, res) => res.json({ status: 'healthy' })
        },
        {
            method: 'get',
            path: '/config',
            handler: (req, res) => res.json(getRuntimeConfig())
        }
    ];
}

function getRuntimeConfig() {
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        cwd: process.cwd(),
        timestamp: new Date().toISOString()
    };
}

function getNetworkUrl(port) {
    try {
        const interfaces = os.networkInterfaces(); // Use the imported os module
        for (const name of Object.keys(interfaces)) {
            for (const net of interfaces[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    return `http://${net.address}:${port}`;
                }
            }
        }
        return 'Network URL unavailable';
    } catch (e) {
        return 'Network URL unavailable';
    }
}