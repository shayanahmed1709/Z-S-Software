export const mainBuildOptions = {
  entryPoints: ['src/main/index.ts', 'src/main/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outdir: 'dist/main',
  external: ['electron', 'better-sqlite3'],
  sourcemap: true,
  logLevel: 'info',
};
