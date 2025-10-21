import { spawn, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import type { Signals } from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const rendererDevServerUrl = process.env.BB_RENDERER_URL ?? 'http://localhost:5173';
const rendererUrl = new URL(rendererDevServerUrl);
const rendererHost = rendererUrl.hostname || 'localhost';
const rendererPort = Number(rendererUrl.port || (rendererUrl.protocol === 'https:' ? '443' : '80'));

function compileMainProcess(): void {
  const result = spawnSync('pnpm', ['run', 'compile'], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function isRendererAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: rendererHost, port: rendererPort }, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(2_000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForRenderer(): Promise<void> {
  const maxWaitMs = 15_000;
  const stepMs = 500;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    if (await isRendererAvailable()) {
      return;
    }

    await delay(stepMs);
  }

  throw new Error(
    `Vite Dev Server по адресу ${rendererDevServerUrl} не запустился за ${maxWaitMs / 1000} секунд. Убедитесь, что команда "pnpm --filter renderer run dev" работает.`,
  );
}

async function startDev(): Promise<void> {
  compileMainProcess();
  await waitForRenderer();

  const electron = spawn('electron', ['dist/main.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  const terminate = (signal: Signals) => {
    electron.kill(signal);
  };

  process.on('SIGINT', terminate);
  process.on('SIGTERM', terminate);

  electron.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

startDev().catch((error) => {
  const reason = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${reason}\n`);
  process.exit(1);
});
