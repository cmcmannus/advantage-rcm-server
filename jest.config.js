import { createDefaultEsmPreset } from "ts-jest";

/** @type {import("jest").Config} **/
export default {
  ...createDefaultEsmPreset(),
  testEnvironment: "node",
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};