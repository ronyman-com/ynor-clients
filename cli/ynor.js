#!/usr/bin/env node
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

// Get the current module path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create require function for ES modules
const require = createRequire(import.meta.url);

// Import all command modules
import { buildCommand } from './commands/build.js';
import { checkCommand } from './commands/check.js';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';

// Import server
import { startServer } from '../server.js';

// CLI configuration
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

// Main CLI function
async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !commands[command]) {
    showHelp();
    process.exit(1);
  }

  try {
    // Execute the command
    const result = await commands[command].execute(args.slice(1));
    
    // If the command returns server config, start the server
    if (result?.serverConfig) {
      await startServer(result.serverConfig);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error executing command "${command}":`, error);
    process.exit(1);
  }
}

// Show help information
function showHelp() {
  console.log('Ynor CLI - Browser Solutions\n');
  console.log('Usage: ynor <command> [options]\n');
  console.log('Available commands:');
  
  for (const [cmd, config] of Object.entries(commands)) {
    console.log(`  ${cmd.padEnd(10)} ${config.description}`);
  }
  
  console.log('\nFor specific command help: ynor <command> --help');
}

// Run the CLI
runCLI().catch(console.error);