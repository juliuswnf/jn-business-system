import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
const reactHooksRecommended = reactHooks.configs['recommended-latest'] || reactHooks.configs.recommended

export default [
  {
    ignores: [
      'dist',
      'src/pages/CustomerDashboard.jsx',
      'src/pages/company/Appointments.jsx',
      'src/pages/company/Employees.jsx'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...(reactHooksRecommended?.rules || {}),
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-undef': 'off',
      'no-irregular-whitespace': 'off'
    }
  }
]
