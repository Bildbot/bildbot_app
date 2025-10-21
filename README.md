# BildBot Desktop

Минимальный каркас Electron + React + Vite + TypeScript для BildBot Desktop. Цель этого состояния репозитория — чтобы после клонирования
и установки зависимостей команда могла собрать приложение и увидеть пустое окно.

## Требования окружения

- Windows 10 22H2+ или Windows 11 для запуска готового приложения.
- Node.js 20 LTS.
- pnpm 9 (установить глобально через `npm install -g pnpm`).

## Установка зависимостей

```bash
pnpm install
```

Команда собирает workspace-зависимости (`@bildbot/shared`, Electron, React, инструменты сборки).

## Запуск в режиме разработки

```bash
pnpm dev
```

Что делает команда:

1. Запускает Vite Dev Server для React-интерфейса (`apps/renderer`).
2. Компилирует main и preload-скрипты Electron (`apps/desktop`).
3. Дожидается доступности `http://localhost:5173` и стартует Electron с подключением к дев-серверу.

В результате открывается окно BildBot Desktop с простой страницей и кнопкой проверки IPC.

> Чтобы указывать собственный адрес дев-сервера, задайте переменную `BB_RENDERER_URL` перед запуском `pnpm dev`.

## Сборка и запуск собранной версии

```bash
pnpm build
pnpm start
```

`pnpm build` выполняет последовательную сборку:

1. Собирает общий пакет `@bildbot/shared`.
2. Собирает фронтенд Vite и кладёт артефакты в `apps/renderer/dist`.
3. Компилирует main/preload-скрипты Electron и копирует статический фронтенд в `apps/desktop/dist/renderer`.

Команда `pnpm start` запускает Electron, используя готовый бандл из `apps/desktop/dist`. Это прямой способ запустить приложение на
машине пользователя без сборки `.exe`. Для упаковки в portable-архив или exe потребуется добавить electron-builder на следующих этапах.

## Безопасность

- Renderer работает в изоляции (`contextIsolation`, `sandbox`, без `nodeIntegration`).
- IPC-каналы валидируются через Zod-схемы из `@bildbot/shared`.
- Базовая CSP задаётся на уровне `session.defaultSession`.
