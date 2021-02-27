const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "dist");
const ie11Dir = path.resolve(distDir, "ie11");

const content = `if (process.env.NODE_ENV === 'production') {
  module.exports = require('./index.production.js')
} else {
  module.exports = require('./index.development.js')
}
`;

function writeEntry(dir) {
  fs.writeFileSync(path.resolve(dir, "index.js"), content);
}

writeEntry(distDir);
writeEntry(ie11Dir);
