declare class ApiError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare const api: {
    get: <T>(path: string) => Promise<T>;
    post: <T>(path: string, data: unknown) => Promise<T>;
    put: <T>(path: string, data: unknown) => Promise<T>;
    patch: <T>(path: string, data: unknown) => Promise<T>;
    delete: <T>(path: string) => Promise<T>;
};
export { ApiError };
//# sourceMappingURL=api.d.ts.map