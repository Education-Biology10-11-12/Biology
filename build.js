// build.js — index.html تێکدەدات و دەیخاتە dist/index.html
// بەکارهێنان:
//   npm init -y
//   npm i javascript-obfuscator html-minifier-terser
//   node build.js
// ئینجا تەنها فۆڵدەری dist (لەگەڵ logo.png و manifest.json و فۆنتەکە) لە GitHub Pages دابنێ.
// فایلی سەرەکی (index.html) لای خۆت بپارێزە و لە گیتهەب دایمەنێ.

const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const { minify } = require("html-minifier-terser");

const SRC = "index.html";
const OUT = "dist";

const obfOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  splitStrings: true,
  splitStringsChunkLength: 8,
  unicodeEscapeSequence: true,   // نووسینە کوردییەکان بە \uXXXX دەکات
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,          // گرنگ: onclick="login()" و هاوشێوەکانی HTML نەشکێن
  selfDefending: false,          // کێشە دروست دەکات لەگەڵ WebView و minify
  debugProtection: false,
  disableConsoleOutput: false,
  target: "browser",
  sourceType: "script",
};

(async () => {
  let html = fs.readFileSync(SRC, "utf8");

  // هەموو <script> ـە ناوەکییەکان (ئەوانەی src نییە)
  html = html.replace(
    /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g,
    (full, attrs = "", code) => {
      if (/\ssrc=/.test(attrs) || !code.trim()) return full;
      const isModule = /type\s*=\s*["']module["']/.test(attrs);
      try {
        const out = JavaScriptObfuscator.obfuscate(code, {
          ...obfOptions,
          sourceType: isModule ? "module" : "script",
        }).getObfuscatedCode();
        return `<script${attrs}>${out}</script>`;
      } catch (e) {
        console.warn("⚠ سکریپتێک تێکنەدرا:", e.message);
        return full;
      }
    }
  );

  html = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false, // پێشتر تێکدراوە
    conservativeCollapse: true,
  });

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.html"), html);

  // فایلە تەنیشتەکان لەگەڵ خۆی دەگوێزرێنەوە
  ["logo.png", "manifest.json", "GoranFontRegular-Regular.ttf"].forEach((f) => {
    if (fs.existsSync(f)) fs.copyFileSync(f, path.join(OUT, f));
  });

  console.log("✓ تەواو بوو: dist/index.html");
})();
