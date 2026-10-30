// build.js — هەموو شتێک تێکدەدات و دەیخاتە فۆڵدەری dist
//   npm init -y
//   npm i javascript-obfuscator html-minifier-terser
//   node build.js
const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const { minify } = require("html-minifier-terser");

const OUT = "dist";
// ئەم فایلانە ناچنە dist (فایلی سەرەکی و ئامرازەکانی build)
const SKIP = ["index.html", "sw.js", "build.js", "README.md", "package.json", "package-lock.json", ".gitignore"];

const base = {
  compact: true,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  splitStrings: true,
  splitStringsChunkLength: 8,
  unicodeEscapeSequence: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  target: "browser",
};
const heavy = { ...base, controlFlowFlattening: true, controlFlowFlatteningThreshold: 0.5, deadCodeInjection: true, deadCodeInjectionThreshold: 0.2 };

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // ١. index.html
  let html = fs.readFileSync("index.html", "utf8");
  html = html.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g, (full, attrs = "", code) => {
    if (/\ssrc=/.test(attrs) || !code.trim()) return full;
    const isModule = /type\s*=\s*["']module["']/.test(attrs);
    try {
      const out = JavaScriptObfuscator.obfuscate(code, { ...heavy, sourceType: isModule ? "module" : "script" }).getObfuscatedCode();
      return `<script${attrs}>${out}</script>`;
    } catch (e) { console.warn("⚠ سکریپتێک تێکنەدرا:", e.message); return full; }
  });
  html = await minify(html, { collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: false, conservativeCollapse: true });
  fs.writeFileSync(path.join(OUT, "index.html"), html);

  // ٢. sw.js (سووکتر، بۆ ئەوەی Service Worker نەشکێت)
  const sw = fs.readFileSync("sw.js", "utf8");
  fs.writeFileSync(path.join(OUT, "sw.js"), JavaScriptObfuscator.obfuscate(sw, base).getObfuscatedCode());

  // ٣. هەموو فایلە تەنیشتەکان (ئایکۆن، لۆگۆ، فۆنت، manifest ...)
  fs.readdirSync(".").forEach((f) => {
    if (SKIP.includes(f) || !fs.statSync(f).isFile()) return;
    fs.copyFileSync(f, path.join(OUT, f));
  });

  console.log("✓ تەواو بوو. ناوەڕۆکی dist:", fs.readdirSync(OUT).join(", "));
})();
