import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer(config = {}) {
    const app = express();
    const port = config.port || 4000; // Default to 4000 for backend

    // Middleware
    app.use(express.json());
    
    // Static files
    (config.staticDirs || []).forEach(dir => {
        app.use(express.static(dir));
    });

    // API Routes
    app.get('/api/data', (req, res) => {
        res.json({ message: 'From backend server' });
    });

    // Start server
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            console.log(`Backend server running on port ${port}`);
            resolve(server);
        });
    });
}

// Default export remains for backward compatibility
export default startServer;