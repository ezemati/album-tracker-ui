//  @ts-check

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    tabWidth: 4,
    printWidth: 120,
    plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
