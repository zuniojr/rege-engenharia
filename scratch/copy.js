const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\Osmar Junior\\.gemini\\antigravity-ide\\brain\\96710cc5-2a07-44f6-8cf0-54a74ff596ca\\hero_rege_1783964665123.png";
const dest = path.join(__dirname, '..', 'public', 'images', 'hero-rege.png');

try {
  fs.copyFileSync(src, dest);
  console.log("Success! Image copied to " + dest);
} catch (err) {
  console.error("Error copying file:", err);
}
