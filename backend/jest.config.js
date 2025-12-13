/**
 * Jest Configuration for JN Automation Backend
 * Node.js ES Modules support
 */

export default {
  // Use Node.js test environment
  testEnvironment: 'node',

  // ES Modules support
  transform: {},

  // Test file patterns - focus on unit tests first
  testMatch: [
    '**/tests/unit/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],

  // Disable coverage thresholds for now (enable after more tests)
  // coverageThreshold: {
  //   global: {
  //     branches: 30,
  //     functions: 30,
  //     lines: 30,
  //     statements: 30
  //   }
  // },

  // Setup files
  setupFilesAfterEnv: ['./tests/setup.js'],

  // Timeout for async tests
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Module name mapping for ES Modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
