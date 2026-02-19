import globals from 'globals';
import pluginSvelte from 'eslint-plugin-svelte';

export default [
	...pluginSvelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		ignores: ['.svelte-kit/', 'build/']
	}
];
