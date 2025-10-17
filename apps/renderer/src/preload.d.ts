declare global {
  interface Window {
    bb: {
      ping: (message: string) => Promise<{ ok: true; echo: string }>;
    };
  }
}

export {};
