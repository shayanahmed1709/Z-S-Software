import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { createServer } from 'vite';
import { mainBuildOptions } from './esbuild-main.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronPath = require('electron');

await esbuild.build(mainBuildOptions);

const server = await createServer({
  configFile: path.join(root, 'vite.config.mts'),
});
await server.listen();

const url = server.resolvedUrls?.local?.[0];
if (!url) {
  console.error('Vite did not report a local URL.');
  await server.close();
  process.exit(1);
}

console.log(`Renderer dev server: ${url}`);

const env = { ...process.env, VITE_DEV_SERVER_URL: url };
delete env.ELECTRON_RUN_AS_NODE;

const electronArgs = ['.'];
if (process.platform === 'linux') {
  electronArgs.push('--no-sandbox', '--disable-dev-shm-usage');
}

const child = spawn(electronPath, electronArgs, {
  cwd: root,
  env,
  stdio: 'inherit',
  windowsHide: false,
});

const closeDevServer = () => server.close();

child.on('exit', (code) => {
  closeDevServer().finally(() => process.exit(code ?? 0));
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill();
    }
    closeDevServer().finally(() => process.exit(0));
  });
}
