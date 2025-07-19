module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: [
    'security',
    '@typescript-eslint'
  ],
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    // Security rules
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-bidi-characters': 'error',
    
    // Additional security-focused rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-alert': 'error',
    'no-console': 'warn',
    
    // Prevent common XSS
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    
    // TypeScript security
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    
    // Prevent prototype pollution
    'no-prototype-builtins': 'error',
    
    // Prevent SQL injection patterns
    'no-multi-str': 'error',
    
    // Prevent command injection
    'security/detect-child-process': 'error',
    
    // Environment variable security
    'no-process-env': 'warn'
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TypeScript-specific security rules
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/prefer-as-const': 'error'
      }
    },
    {
      files: ['**/__tests__/**/*', '**/*.test.*'],
      rules: {
        // Relax some rules for tests
        'no-console': 'off',
        'security/detect-non-literal-require': 'off'
      }
    }
  ],
  settings: {
    react: {
      version: 'detect'
    }
  }
}