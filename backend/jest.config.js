module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetModules: true,
  restoreMocks: true,
  collectCoverage: true,
  coverageDirectory: '../coverage-report',
  coverageReporters: ['html', 'text', 'lcov'],
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    '!src/**/*.routes.ts',
    '!src/**/*.model.ts'
  ]
};
