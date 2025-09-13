export async function safeAwaitWithStatus<T>(
  promise: Promise<T>,
): Promise<[T | null, Error | null, number | null]> {
  try {
    const data = await promise;
    return [data, null, null];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const status = err?.response?.status || null;
    return [null, error, status];
  }
}
