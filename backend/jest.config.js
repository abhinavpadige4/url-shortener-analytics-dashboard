{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src", "<rootDir>/tests"],
  "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/server.ts"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/dist/"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": ["json", "lcov", "text"],
  "verbose": true
}