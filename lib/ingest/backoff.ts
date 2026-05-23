import { sleep } from "./http";

export async function withBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  baseMs = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt === maxAttempts - 1) break;
      const delay = baseMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw lastError!;
}
