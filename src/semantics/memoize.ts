export function memoize<TClass, TIn, TReturn>(
    this: TClass,
    originalMethod: (p: TIn) => TReturn,
    context: ClassMethodDecoratorContext
) {
    void context;
    const cache = new Map<TIn, TReturn>();
    return function (this: TClass, p: TIn) {
        if (cache.has(p)) return cache.get(p)!;
        const ret = originalMethod.apply(this, [p]);
        cache.set(p, ret);
        return ret;
    };
}
