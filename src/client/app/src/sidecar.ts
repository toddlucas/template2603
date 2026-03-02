import { ChildProcess, spawn } from 'child_process';
import path from 'node:path';
import net from 'net';
import { app } from 'electron';

const HEALTH_CHECK_TIMEOUT_MS = 15_000;
const HEALTH_CHECK_INTERVAL_MS = 250;
const SHUTDOWN_GRACE_MS = 5_000;
const MAX_RESTART_ATTEMPTS = 3;

export interface SidecarHandle {
  port: number;
  stop: () => Promise<void>;
}

/**
 * Finds a free TCP port on localhost.
 */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not determine free port'));
        return;
      }
      const port = address.port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

/**
 * Polls GET /health until the sidecar responds 200 or the timeout elapses.
 */
async function waitForHealthy(port: number): Promise<void> {
  const deadline = Date.now() + HEALTH_CHECK_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      // Not ready yet — keep polling.
    }
    await new Promise(r => setTimeout(r, HEALTH_CHECK_INTERVAL_MS));
  }
  throw new Error(`Sidecar did not become healthy within ${HEALTH_CHECK_TIMEOUT_MS}ms`);
}

/**
 * Resolves the path to the sidecar executable.
 *
 * In development: expects the binary to be in the repo at
 *   src/server/Base2.Desktop.Host/src/bin/Debug/net10.0/Base2.Desktop.Host.exe
 *
 * In production (packaged): bundled in resources/sidecar/
 */
function resolveSidecarPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'sidecar', 'Base2.Desktop.Host.exe');
  }
  // Development: walk up from app/ to repo root, then into the server project.
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
  return path.join(
    repoRoot,
    'src', 'server', 'Base2.Desktop.Host', 'src',
    'bin', 'Debug', 'net10.0', 'Base2.Desktop.Host.exe',
  );
}

/**
 * Spawns the .NET sidecar on the given port and waits for it to be healthy.
 * Returns a handle with the port and a stop() function.
 */
export async function startSidecar(restartAttempt = 0): Promise<SidecarHandle> {
  const port = await findFreePort();
  const exePath = resolveSidecarPath();

  const proc: ChildProcess = spawn(exePath, ['--urls', `http://127.0.0.1:${port}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  proc.stdout?.on('data', (data: Buffer) => {
    console.log('[sidecar]', data.toString().trim());
  });
  proc.stderr?.on('data', (data: Buffer) => {
    console.error('[sidecar:err]', data.toString().trim());
  });

  proc.on('exit', (code, signal) => {
    console.warn(`[sidecar] exited (code=${code}, signal=${signal})`);
  });

  try {
    await waitForHealthy(port);
  } catch (err) {
    proc.kill();
    throw err;
  }

  console.log(`[sidecar] healthy on port ${port}`);

  const stop = (): Promise<void> => {
    return new Promise(resolve => {
      if (proc.exitCode !== null) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        resolve();
      }, SHUTDOWN_GRACE_MS);

      proc.on('exit', () => {
        clearTimeout(timer);
        resolve();
      });

      proc.kill('SIGTERM');
    });
  };

  return { port, stop };
}

/**
 * Starts the sidecar with automatic restart on unexpected exit.
 * Calls onPortChange whenever the sidecar (re)starts on a new port.
 */
export function startSidecarWithRestart(
  onPortChange: (port: number) => void,
  onFatalError: (err: Error) => void,
): () => Promise<void> {
  let handle: SidecarHandle | null = null;
  let stopped = false;
  let attempts = 0;

  async function start() {
    if (stopped) return;
    try {
      handle = await startSidecar(attempts);
      attempts = 0;
      onPortChange(handle.port);
    } catch (err) {
      attempts++;
      if (attempts >= MAX_RESTART_ATTEMPTS) {
        onFatalError(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      console.warn(`[sidecar] restart attempt ${attempts}/${MAX_RESTART_ATTEMPTS}`);
      setTimeout(start, 1_000 * attempts);
    }
  }

  start();

  return async () => {
    stopped = true;
    await handle?.stop();
  };
}
