module.exports = {
    root: true,
    env: { browser: true, es2020: true, node: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
    ],
    // Build output and vendored third-party bundles are not our source.
    // dist-pages is the Cloudflare Pages copy of dist; public/duckdb holds the
    // minified DuckDB-WASM workers copied from node_modules at build time.
    ignorePatterns: ['dist', 'dist-pages', 'dist-ssr', 'public/duckdb', 'node_modules', '.eslintrc.cjs'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        'react/prop-types': 'off',
        'no-unused-vars': 'warn',
        'react/no-unescaped-entities': 'off'
    },
}
