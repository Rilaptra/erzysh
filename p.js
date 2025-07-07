const fs = require("fs");

fs.writeFileSync(
  "./file.txt",
  "#".repeat(1024 * 1024 * 15)
  // JSON.stringify(
  // fs.readFileSync("E:/Project/cli/golang2/erzy_shell.exe", "utf-8")
  // )
);
