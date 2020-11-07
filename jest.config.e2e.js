module.exports = {
  preset: "jest-puppeteer",
  moduleDirectories: ["node_modules", "./src"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
};
