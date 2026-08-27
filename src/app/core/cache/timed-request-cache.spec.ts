import { TimedRequestCache } from './timed-request-cache';

describe('TimedRequestCache', () => {
  it('deduplicates in-flight loads and serves fresh values', async () => {
    let resolveLoad!: (value: string) => void;
    const load = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const cache = new TimedRequestCache<string>(1_000);

    const first = cache.get('key', load);
    const second = cache.get('key', load);
    await Promise.resolve();
    resolveLoad('value');

    await expect(Promise.all([first, second])).resolves.toEqual([
      'value',
      'value',
    ]);
    await expect(cache.get('key', load)).resolves.toBe('value');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads expired values and failed requests', async () => {
    let now = 10;
    const cache = new TimedRequestCache<string>(100, 50, () => now);
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await expect(cache.get('key', load)).rejects.toThrow('offline');
    await expect(cache.get('key', load)).resolves.toBe('first');
    now = 111;
    await expect(cache.get('key', load)).resolves.toBe('second');
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('evicts the least recently used value when bounded', async () => {
    const cache = new TimedRequestCache<string>(1_000, 2);
    const load = (value: string) => () => Promise.resolve(value);

    await cache.get('one', load('one'));
    await cache.get('two', load('two'));
    await cache.get('one', load('unused'));
    await cache.get('three', load('three'));

    const reloadTwo = vi.fn(load('two-again'));
    await expect(cache.get('two', reloadTwo)).resolves.toBe('two-again');
    expect(reloadTwo).toHaveBeenCalledOnce();
  });
});
