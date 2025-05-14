import path from 'path';
import { fileURLToPath } from 'url';
import { startServer } from '../../server.js';
import { buildCommand } from './build.js';
import os from 'os';
import fs from 'fs';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startCommand(args = []) {
    const options = parseArgs(args);
    const env = options.env || 'development';
    
    try {
        if (env === 'development') {
            console.log('Building in development mode...');
            await buildCommand(['--dev']);
        }

        const projectRoot = path.join(__dirname, '../../');
        const distDir = path.join(projectRoot, 'dist');

        // Verify dist directory exists
        if (!fs.existsSync(distDir)) {
            throw new Error(`Dist directory not found at: ${distDir}`);
        }

        const staticDirs = [
            distDir,
            path.join(projectRoot, 'public'),
            path.join(projectRoot, 'core', 'dist')
        ].filter(dir => fs.existsSync(dir));

        const server = await startServer({
            mode: env,
            port: options.port || 3000,
            staticDirs,
            distDir
        });

        const port = server.address().port;
        
        return {
            server,
            urls: {
                local: `http://localhost:${port}`,
                network: getNetworkUrl(port)
            }
        };
    } catch (error) {
        throw new Error(`Failed to start server: ${error.message}`);
    }
}



function getValidStaticDirs(projectRoot) {
    const possibleDirs = [
        path.join(projectRoot, 'dist'),
        path.join(projectRoot, 'public'),
        path.join(projectRoot, 'core', 'dist')
    ];
    
    return possibleDirs.filter(dir => {
        try {
            return fs.existsSync(dir);
        } catch {
            return false;
        }
    });
}

function getWatchDirs(projectRoot) {
    return [
        path.join(projectRoot, 'src'),
        path.join(projectRoot, 'core', 'src')
    ];
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