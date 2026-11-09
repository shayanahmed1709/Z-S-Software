import esbuild from 'esbuild';
import { mainBuildOptions } from './esbuild-main.mjs';

await esbuild.build(mainBuildOptions);
