const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', '.expo/*', 'src/api/schema.d.ts'],
  },
  {
    // Правила ТЗ, раздел 4: экраны не ходят в fetch напрямую и не используют хекс-коды цветов.
    files: ['app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Запросы — только через src/api и хуки из src/features.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message: 'Цвета — только из src/ui/tokens.ts.',
        },
      ],
    },
  },
]);
