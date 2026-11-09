import type { ZsApi } from '../shared/types';

declare global {
  interface Window {
    zs: ZsApi;
  }
}

export {};
