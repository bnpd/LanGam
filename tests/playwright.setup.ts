import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';
import type { FullConfig } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test PocketBase instance
let pbProcess: ChildProcess | null = null;
const TEST_PORT = 8091;
const TEST_BASE_URL = process.env.TEST_ENV == 'dev' ? `http://127.0.0.1:${TEST_PORT}` : 'https://langam.pockethost.io' ;

// Dev server process
let frontend: ChildProcess | null = null;

export const testConfig = {
  pocketbaseUrl: TEST_BASE_URL,
  gameEn: '4mewm',
  gamePl: 'euurc'
};

// Setup test database directory
function setupTestDb() {
  const initialTestDbDir = join(__dirname, '..', '..', 'ALLai-backend', 'pb_data');
  const testDbDir = join(__dirname, '..', '..', 'ALLai-backend', 'test_pb_data');
  
  // Clean and recreate test directory
  if (fs.existsSync(testDbDir)) {
    fs.rmSync(testDbDir, { recursive: true, force: true });
  }
  fs.cpSync(initialTestDbDir, testDbDir, { recursive: true });

  return testDbDir;
}

// Start test PocketBase instance
async function startTestPocketBase() {
  const testDbDir = setupTestDb();
  
  return new Promise<void>((resolve, reject) => {
    pbProcess = spawn('./pocketbase.exe', [
      'serve',
      `--dir=${testDbDir}`,
      `--http=127.0.0.1:${TEST_PORT}`,
      '--dev'
    ], {
      cwd: join(__dirname, '..', '..', 'ALLai-backend'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let started = false;
    
    pbProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log('PB stdout:', output);
      
      if (output.includes('Server started') && !started) {
        started = true;
        setTimeout(resolve, 1000); // Give it a moment to fully start
      }
    });

    pbProcess.stderr?.on('data', (data: Buffer) => {
      console.error('PB stderr:', data.toString());
    });

    pbProcess.on('error', (error: Error) => {
      console.error('Failed to start PocketBase:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        reject(new Error('PocketBase failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

// Stop test PocketBase instance
async function stopTestPocketBase() {
  if (pbProcess) {
    pbProcess.kill('SIGTERM');
    
    return new Promise<void>((resolve) => {
      pbProcess!.on('exit', () => {
        pbProcess = null;
        resolve();
      });
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (pbProcess) {
          pbProcess.kill('SIGKILL');
          pbProcess = null;
        }
        resolve();
      }, 5000);
    });
  }
}

// Start dev server
async function startFrontend() {
  return new Promise<void>((resolve, reject) => {
    console.log('Building and starting frontend...');
    let started = false;
    
    // First run the build with test environment
    const build = spawn('vite', ['build', '--mode', 'test'], {
      stdio: 'pipe',
      shell: true
    });

    console.log('Build output:');

    build.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    build.stderr?.on('data', (data) => {
      console.error(data.toString());
    });

    build.on('error', (error) => {
      reject(new Error(`Build process error: ${error}`));
    });

    // After build completes successfully, start preview
    build.on('exit', (code) => {
        if (code !== 0) {
            reject(new Error(`Build failed with code ${code}`));
            return;
        }

        console.log('Build complete, starting preview server... Output:');
        frontend = spawn('vite', ['preview', '--mode', 'test'], {
            stdio: 'pipe',
            shell: true
        });

        frontend.stdout?.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            // Preview server typically shows a message about the port it's running on when ready
            if (output.includes('localhost') && !started) {
                started = true;
                resolve();
            }
        });

        frontend.stderr?.on('data', (data) => {
            if (data.toString().includes('Debugger attached')) {
                return; // debugger messages are not errors
            }
            console.error(`Frontend error: ${data}`);
        });

        frontend.on('error', (error) => {
            if (error.toString().includes('Debugger attached')) {
                return; // debugger messages are not errors
            }
            reject(new Error(`Frontend error: ${error}`));
        });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        reject(new Error('Frontend failed to start within 20 seconds'));
      }
    }, 20000);
  });
}

// Stop dev server
async function stopFrontend() {
  if (frontend) {
    frontend.kill('SIGTERM');
    
    return new Promise<void>((resolve) => {
      frontend!.on('exit', () => {
        frontend = null;
        resolve();
      });
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (frontend) {
          frontend.kill('SIGKILL');
          frontend = null;
        }
        resolve();
      }, 5000);
    });
  }
}

export default async function setup(_config: FullConfig) {
  console.log('Starting test PocketBase instance...');
  await startTestPocketBase();
  console.log('Starting frontend...');
  await startFrontend();
  console.log('Test setup complete');

  return async () => {
    console.log('Stopping frontend...');
    await stopFrontend();
    console.log('Stopping test PocketBase instance...');
    await stopTestPocketBase();
    console.log('Test teardown complete');
  };
}
