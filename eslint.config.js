import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig(
	js.configs.recommended,
	...ts.configs.recommended,
	stylistic.configs.customize({
		commaDangle: 'never',
		indent: 'tab',
		jsx: false,
		semi: true
	}),
	{
		languageOptions: {
			globals: { ...globals.node }
		},
		rules: {
			'no-case-declarations': 'off',
			'@stylistic/arrow-parens': ['error', 'as-needed'],
			'@stylistic/eol-last': 'off',
			'@stylistic/no-extra-parens': 'error'
		}
	}
);