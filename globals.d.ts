export {};

declare global {
  interface Window {
    processEnv: {
      NODE_ENV: string;
    };
  }
}