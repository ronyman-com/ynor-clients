import path from 'path';
import { fileURLToPath } from 'url';
import { startServer } from '../../server.js';
import { buildCommand } from './build.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startCommand(args = []) {
    const options = parseArgs(args);
    const env = options.env || 'development';
    
    try {
        // Build in development mode
        if (env === 'development') {
            console.log('Building in development mode...');
            await buildCommand(['--watch']);
        }

        // Start the server
        const server = await startServer({
            mode: env,
            port: options.port || 3000,
            staticDirs: [
                path.join(process.cwd(), 'dist'),
                path.join(__dirname, '../../../public')
            ],
            liveReload: env === 'development',
            routes: generateRoutes()
        });

        console.log(`Server running at http://localhost:${server.address().port}`);
        
        return {
            server,
            urls: {
                local: `http://localhost:${server.address().port}`,
                network: getNetworkUrl(server.address().port)
            }
        };
    } catch (error) {
        console.error('Failed to start server:', error.message);
        return {
            success: false,
            error: error.message
        };
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
        const interfaces = require('os').networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const net of interfaces[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    return `http://${net.address}:${port}`;
                }
            }
        }
    } catch (e) {
        return 'Network URL unavailable';
    }
}