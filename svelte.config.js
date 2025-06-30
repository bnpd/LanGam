import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import preprocess from 'svelte-preprocess'

const preprocessConfig = preprocess()
const origMarkup = preprocessConfig.markup
preprocessConfig.markup = async function () {
	const res = await origMarkup.apply(this, arguments)
	// remove whitespace
	res.code = res.code.replace(/([>}])\s+([<{])/sg, '$1$2')
	return res
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess(), preprocessConfig],

	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		csp: {
			directives: {
				'default-src': ['self', 'https://*.langam.app'],
				'connect-src': ['self', 'https://*.langam.app', 'https://*.wiktionary.org'],
				'media-src': ['self', 'https://*.langam.app', 'https://*.wiktionary.org'],
				'img-src': ['self', 'data:', 'https://*.langam.app', 'https://*.wiktionary.org'],
				'style-src': ['self', 'https:', "'unsafe-inline'"],
				'script-src': ['self', 'https://*.langam.app'],
				'object-src': ['self'],
				'base-uri': ['self']
			}
		}
	}
};

export default config;
