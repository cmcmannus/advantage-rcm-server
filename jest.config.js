import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.e2e.test.ts"
  ],
  testTimeout: 30000,
  globalSetup: undefined,
  globalTeardown: undefined,
};