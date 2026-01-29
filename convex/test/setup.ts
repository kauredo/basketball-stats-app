import { vi } from "vitest";

// Global test setup for Convex tests

// Mock crypto.getRandomValues for token generation
if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: (array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      subtle: {
        digest: vi.fn().mockImplementation(async (algorithm: string, data: BufferSource) => {
          // Return a mock hash buffer
          const mockHash = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            mockHash[i] = i;
          }
          return mockHash.buffer;
        }),
      },
    },
    writable: true,
  });
}
