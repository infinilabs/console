export function keysOf<T, K extends keyof T>(obj: T): K[] {
    return Object.keys(obj) as K[];
}   