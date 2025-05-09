import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function mergeDirectory(src, dest) {
    try {
        await fs.mkdir(dest, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await mergeDirectory(srcPath, destPath);
        } else {
            try {
                const destStats = await fs.stat(destPath);
                const srcStats = await fs.stat(srcPath);
                if (srcStats.mtimeMs > destStats.mtimeMs) {
                    await fs.copyFile(srcPath, destPath);
                    console.log(`Updated: ${path.relative(dest, destPath)}`);
                }
            } catch {
                await fs.copyFile(srcPath, destPath);
                console.log(`Added: ${path.relative(dest, destPath)}`);
            }
        }
    }
}

async function generateFileTree(dir, baseDir = dir) {
    const tree = {};
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
            tree[relativePath] = await generateFileTree(fullPath, baseDir);
        } else {
            const stats = await fs.stat(fullPath);
            tree[relativePath] = {
                type: 'file',
                size: stats.size,
                modified: stats.mtime,
                path: fullPath
            };
        }
    }

    return tree;
}

async function syncProjectFolders(destinationFolder) {
    const foldersToSync = [
        {
            name: 'core',
            src: path.join(__dirname, '../../core'),
            dest: path.join(destinationFolder, 'core')
        },
        {
            name: 'dist',
            src: path.join(__dirname, '../../../dist'),
            dest: path.join(destinationFolder, 'core/dist')  // Key change here
        }
    ];

    for (const folder of foldersToSync) {
        try {
            await fs.access(folder.src);
            console.log(`Syncing ${folder.name} folder to ${folder.dest}...`);
            await mergeDirectory(folder.src, folder.dest);
        } catch (error) {
            console.warn(`Warning: ${folder.name} folder not found at ${folder.src}`);
        }
    }
}

async function getVersionInfo(versionPath) {
    try {
        const versionData = await fs.readFile(versionPath, 'utf-8');
        return JSON.parse(versionData);
    } catch {
        return { version: '0.0.0' };
    }
}

async function needsMigration(destCore) {
    try {
        await fs.access(destCore);
        const destVersion = await getVersionInfo(path.join(destCore, 'version.json'));
        const sourceVersion = await getVersionInfo(path.join(__dirname, '../../core/version.json'));
        return destVersion.version !== sourceVersion.version;
    } catch {
        return false;
    }
}

export async function initCommand(args = []) {
    try {
        const destinationFolder = process.cwd();
        const destCore = path.join(destinationFolder, 'core');
        const disJsonPath = path.join(destCore, 'dis.json');
        const versionInfo = await getVersionInfo(path.join(__dirname, '../../core/version.json'));

        const shouldMigrate = await needsMigration(destCore);
        await syncProjectFolders(destinationFolder);

        console.log('Generating file tree...');
        const fileTree = await generateFileTree(destinationFolder);

        await fs.mkdir(path.dirname(disJsonPath), { recursive: true });
        await fs.writeFile(
            disJsonPath,
            JSON.stringify({
                meta: {
                    generatedAt: new Date().toISOString(),
                    command: 'init',
                    operation: shouldMigrate ? 'migration' : 'initialization',
                    version: versionInfo.version
                },
                fileTree
            }, null, 2)
        );

        console.log(`Core ${shouldMigrate ? 'updated' : 'initialized'} successfully!`);
        console.log(`File tree saved to: ${disJsonPath}`);

        return {
            success: true,
            operation: shouldMigrate ? 'migration' : 'initialization',
            serverConfig: {
                staticDirs: [
                    path.join(destinationFolder, 'core/dist'),  // Updated path
                    path.join(destinationFolder, 'public')
                ],
                routes: [
                    {
                        method: 'get',
                        path: '/core-status',
                        handler: async (req, res) => {
                            res.json({ 
                                status: 'active',
                                version: versionInfo.version,
                                distLocation: 'core/dist'  // Added for clarity
                            });
                        }
                    }
                ]
            }
        };
    } catch (error) {
        console.error('Initialization failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}