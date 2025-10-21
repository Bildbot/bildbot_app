import { access, constants, cp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptsDir, '..');
const rendererDist = resolve(desktopRoot, '../renderer/dist');
const desktopRendererTarget = resolve(desktopRoot, 'dist/renderer');

async function ensureRendererBuild(): Promise<void> {
  try {
    await access(rendererDist, constants.R_OK);
  } catch (error) {
    throw new Error(
      'Не найден собранный интерфейс в apps/renderer/dist. Выполните "pnpm --filter renderer run build" перед сборкой Electron-шела.',
      { cause: error },
    );
  }
}

async function copyRendererBuild(): Promise<void> {
  await ensureRendererBuild();
  await rm(desktopRendererTarget, { force: true, recursive: true });
  await cp(rendererDist, desktopRendererTarget, { recursive: true });
  process.stdout.write(`Renderer скопирован в ${desktopRendererTarget}\n`);
}

copyRendererBuild().catch((error) => {
  const reason = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${reason}\n`);
  process.exitCode = 1;
});
