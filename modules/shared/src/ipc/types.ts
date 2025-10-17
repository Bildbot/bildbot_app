import { z } from 'zod';

// Базовые IPC схемы
export const PingSchema = z.object({
  message: z.string(),
});

export type PingPayload = z.infer<typeof PingSchema>;
export type PingResponse = { ok: true; echo: string };

// Каналы IPC
export const IPC_CHANNELS = {
  PING: 'ipc:ping',
} as const;
