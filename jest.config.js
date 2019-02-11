module.exports = {
    testEnvironment: "node",
    transform: {
      ".ts": "ts-jest"
    },
    moduleFileExtensions: [
      "ts",
      "js",
    ],
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)$",
    coverageDirectory: "coverage",
    collectCoverageFrom: [
      "src/**/*.{ts,js}",
      "!src/index.{ts,js}",
      "!src/**/*.d.ts",
    ],
};
