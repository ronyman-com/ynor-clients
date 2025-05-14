#!/usr/bin/env node
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Command imports
import { buildCommand } from './commands/build.js';
import { checkCommand } from './commands/check.js';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';

const commands = {
  init: {
    description: 'Initialize a new Ynor project',
    execute: initCommand
  },
  build: {
    description: 'Build the project assets',
    execute: buildCommand
  },
  check: {
    description: 'Validate project configuration',
    execute: checkCommand
  },
  start: {
    description: 'Start the development server',
    execute: startCommand
  }
};

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !commands[command]) {
    showHelp();
    process.exit(1);
  }

  try {
    const result = await commands[command].execute(args.slice(1));
    
    if (command === 'start' && result?.server) {
      console.log('\nServer running:');
      console.log(`- Local:   ${result.urls?.local || 'http://localhost:' + result.server.address().port}`);
      
      if (result.urls?.network) {
        console.log(`- Network: ${result.urls.network}`);
      }
      
      console.log('\nPress Ctrl+C to stop');
      
      // Keep process alive
      await new Promise(() => {});
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Ynor CLI - Browser Solutions\n');
  console.log('Usage: ynor <command> [options]\n');
  console.log('Available commands:');
  
  for (const [cmd, config] of Object.entries(commands)) {
    console.log(`  ${cmd.padEnd(10)} ${config.description}`);
  }
  
  console.log('\nFor specific command help: ynor <command> --help');
}

function logServerInfo(server, urls) {
  console.log('\nServer running:');
  console.log(`- Local:   ${urls.local}`);
  if (urls.network) {
    console.log(`- Network: ${urls.network}`);
  }
  console.log('\nPress Ctrl+C to stop');
}

function setupGracefulShutdown(server) {
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
  });
}

runCLI().catch(console.error);