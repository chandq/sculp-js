// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/core-index.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],

  testEnvironment: 'jsdom',
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 30000,
  // maxWorkers: 1, // 关键：串行执行测试，避免并行问题
  setupFiles: ['jest-canvas-mock']
  // setupFilesAfterEnv: ['./jest.setup.js']
};
