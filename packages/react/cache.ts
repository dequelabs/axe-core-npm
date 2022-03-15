const _cache: { [key: string]: string } = {};

const cache = {
  set(key: string, value: string): void {
    _cache[key] = value;
  },
  get(key: string): string {
    return _cache[key];
  },
  clear(): void {
    Object.keys(_cache).forEach(key => {
      delete _cache[key];
    });
  }
};

export = cache;
