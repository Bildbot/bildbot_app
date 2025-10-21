import type { PingResponse } from '@bildbot/shared';

declare global {
  interface Window {
    bb: {
      ping: (message: string) => Promise<PingResponse>;
    };
  }
}

export {};
