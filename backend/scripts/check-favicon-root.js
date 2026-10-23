const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..", "..");
for (const name of ["favicon.png", "favicon.ico", "site.webmanifest"]) {
  console.log(name, fs.existsSync(path.join(root, name)) ? "OK" : "MISSING");
}
