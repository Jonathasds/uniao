const fs = require("fs");
const path = require("path");

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f)) {
      let c = fs.readFileSync(p, "utf8");
      if (c.includes("motionless-card")) {
        fs.writeFileSync(p, c.split("motionless-card").join("div"));
        console.log("fixed", p);
      }
    }
  }
}

walk(path.join(__dirname, "..", "src"));
