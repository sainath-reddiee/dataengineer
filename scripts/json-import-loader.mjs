// Node ESM requires `with { type: 'json' }`. Vite's JSON plugin forbids it.
// This loader lets Node tests import the same source files Vite bundles.
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    return nextLoad(url, {
      ...context,
      format: 'json',
      importAttributes: { type: 'json' },
    });
  }
  return nextLoad(url, context);
}
