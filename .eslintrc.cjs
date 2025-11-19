module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:security/recommended',
  ],
  plugins: ['@typescript-eslint', 'security'],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    // TypeScript specific
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    
    // Security
    'security/detect-object-injection': 'off', // Too many false positives
    'security/detect-non-literal-fs-filename': 'warn',
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    '*.bundle.js',
    // Vendored code
    'Agentverse/ui/src/phaser3-rex-plugins/',
    'SYMBI SYNERGY/',
    'SYMBI SYNERGY_backup_*/',
    // Legacy TypeScript 3.x subpackages
    'Agentverse/ui/src/**/framework/',
  ],
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts', '**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
