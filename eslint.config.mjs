//  @ts-check

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig([
    js.configs.recommended,
    {
        extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
        languageOptions: {
            parserOptions: {
                project: undefined,
                projectService: {
                    allowDefaultProject: ['*.js', '*.mjs'],
                },
            },
        },
        rules: {
            '@typescript-eslint/no-confusing-void-expression': 'off',
            '@typescript-eslint/restrict-template-expressions': [
                'error',
                {
                    allowBoolean: true,
                    allowNumber: true,
                },
            ],
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    checksVoidReturn: {
                        attributes: false,
                    },
                },
            ],
        },
    },
    {
        files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
        ...reactHooks.configs.flat.recommended,
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            ...reactHooks.configs.flat.recommended.rules,
            'react-hooks/exhaustive-deps': 'error',
        },
    },
    // ...tanstackConfig,
    {
        rules: {
            'import/no-cycle': 'off',
            'import/order': 'off',
            'sort-imports': 'off',
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/require-await': 'off',
            'pnpm/json-enforce-catalog': 'off',
        },
    },
    {
        ignores: [
            // 'eslint.config.js',
            'prettier.config.js',
            'dist/',
        ],
    },
]);
