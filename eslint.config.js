import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig(
	js.configs.recommended,
	...ts.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.node }
		},
		rules: {
			'max-len': ['warn', { 'code': 100, 'ignoreStrings': true, 'ignoreTemplateLiterals': true, 'ignoreComments': true, 'tabWidth': 2 }],
			'indent': ['warn', 'tab', { 'SwitchCase': 1 }],
			'linebreak-style': ['warn', 'unix'],
			'quotes': ['warn', 'single'],
			'comma-dangle': ['warn', 'never'],
			'semi': ['warn', 'always'],
			'no-unused-vars': ['warn', {}],
			'no-case-declarations': 'off',
			'brace-style': ['warn', 'stroustrup'],
			'object-curly-spacing': ['warn', 'always'],
			'no-var-requires': 'off',
			'arrow-parens': ['warn', 'as-needed'],
			'newline-per-chained-call': 'warn'
		}
	}
);