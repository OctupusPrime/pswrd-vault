import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
	return {
		plugins: [
			svelte(),
			tailwindcss(),
			viteSingleFile(),
			{
				name: 'inject-csp',
				transformIndexHtml(html) {
					if (command === 'build') {
						const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; frame-src 'none';" />`;
						return html.replace('<head>', `<head>\n    ${csp}`);
					}
					return html;
				}
			}
		],
		build: {
			cssCodeSplit: false,
			assetsInlineLimit: 100000000,
			sourcemap: false
		},
		resolve: {
			alias: {
				$lib: path.resolve('./src/lib'),
				$assets: path.resolve('./src/assets'),
				$features: path.resolve('./src/features')
			}
		}
	};
});
