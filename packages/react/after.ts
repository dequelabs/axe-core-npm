let restoreFunctions: (() => unknown)[] = [];

export default function after(
  host: React.Component,
  name: string,
  cb: (host: React.Component) => unknown
): void {
  const originalFn: () => unknown = host[name];
  let restoreFn: () => void;

  if (originalFn) {
    host[name] = function (...args): void {
      originalFn.apply(this, args);
      cb(host);
    };
    restoreFn = function (): void {
      host[name] = originalFn;
    };
  } else {
    host[name] = function (): void {
      cb(host);
    };
    restoreFn = function (): void {
      delete host[name];
    };
  }

  restoreFunctions.push(restoreFn);
}

after.restorePatchedMethods = function (): void {
  restoreFunctions.forEach(restoreFn => restoreFn());
  restoreFunctions = [];
};
