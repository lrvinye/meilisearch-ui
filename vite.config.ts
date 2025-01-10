// vite.config.ts
import { defineConfig, loadEnv, Plugin } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import SemiPlugin from './src/lib/semi';
import UnoCSS from 'unocss/vite';
import { execSync } from 'child_process';

// Plugin to get Git hash
function gitHashPlugin(): Plugin {
  return {
    name: 'git-hash-plugin',
    config: () => {
      const hash = execSync('git rev-parse HEAD').toString().trim();
      return {
        define: {
          __GIT_HASH__: JSON.stringify(hash),
        },
      };
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.debug('print current base path', env.BASE_PATH);
  return {
    base: env.BASE_PATH || '',
    plugins: [
      tsconfigPaths({ root: './' }),
      react(),
      UnoCSS(),
      TanStackRouterVite(),
      SemiPlugin({
        theme: '@semi-bot/semi-theme-meilisearch',
      }),
      gitHashPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 24900,
    },
    preview: {
      host: true,
      port: 24900,
      strictPort: true,
    },
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // node_modules is mostly the main reason for the large chunk problem,
            // With this you're telling Vite to treat the used modules separately.
            // To understand better what it does,
            // try to compare the logs from the build command with and without this change.
            if (id.includes('node_modules')) {
              const importStrArr = id.toString().split('node_modules/');
              return importStrArr[importStrArr.length - 1].split('/')[0].toString();
            }
          },
        },
      },
    },
    experimental: {
      renderBuiltUrl() {
          return { relative: true };
      },
    },
  };
});
