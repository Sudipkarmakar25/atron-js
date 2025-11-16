export type TryCatchFn<T> = () => Promise<T> | T;
export type TryCatchResult<T> = [T | null, unknown];
