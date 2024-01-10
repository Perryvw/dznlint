export function memoize<TClass, TIn, TReturn, TRest extends unknown[]>(
    context: TClass,
    originalMethod: (p: TIn, ...rest: TRest) => TReturn,
) {
    const cache = new Map<TIn, TReturn>();
    return function (this: TClass, p: TIn, ...rest: TRest) {
        if (cache.has(p)) return cache.get(p)!;
        const ret = originalMethod.apply(context, [p, ...rest]);
        cache.set(p, ret);
        return ret;
    };
}
