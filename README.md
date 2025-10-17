# BildBot Desktop

Electron + React + Vite + TS. Portable zip. Windows 10 22H2+.

## Dev

pnpm i
pnpm dev # desktop (tsx watch) + vite (run separately in apps/renderer if needed)

## Build

pnpm build

## Security

Renderer is isolated; IPC typed with zod. Tokens via DPAPI.
