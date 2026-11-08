export function format(fmt, ...args) {
  let i = 0;
  return String(fmt).replace(/%[sdj%]/g, (token) => {
    if (token === '%%') return '%';
    if (i >= args.length) return token;
    const arg = args[i++];
    if (token === '%j') {
      try {
        return JSON.stringify(arg);
      } catch {
        return '[Circular]';
      }
    }
    return String(arg);
  });
}

export function inherits(ctor, superCtor) {
  Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  ctor.super_ = superCtor;
}

export function debuglog() {
  return () => {};
}

export function deprecate(fn) {
  return fn;
}

export default { format, inherits, debuglog, deprecate };
