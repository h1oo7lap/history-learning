#!/usr/bin/env node
// Quét lỗi giao diện phổ biến trong apps/web. Chạy được trên Windows/macOS/Linux, chỉ cần Node.
// Dùng (từ gốc repo): node .agents/skills/history-learning-frontend/scripts/audit-ui.mjs [file-hoặc-thư-mục ...]
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['apps/web/app', 'apps/web/components', 'apps/web/features'];
const exts = new Set(['.ts', '.tsx', '.css']);
const files = [];
const walk = (p) => {
  if (!existsSync(p)) return;
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const n of readdirSync(p)) if (n !== 'node_modules' && n !== '.next') walk(join(p, n));
  } else if (exts.has(extname(p)) && !/\.spec\./.test(p)) files.push(p);
};
roots.forEach(walk);

// [tên, regex (cờ g), chỉ áp cho tsx/ts, bỏ qua dòng khai báo biến css]
const rules = [
  ['style inline (style={{)', /style=\{\{/g],
  ['mã màu hex trong TSX', /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![\w-])/g, { code: true }],
  ['gradient', /gradient\(/g],
  ['chữ gradient', /background-clip|WebkitBackgroundClip|bg-clip-text/g],
  ['kính mờ (backdrop blur)', /backdrop-?filter|backdrop-blur/g],
  ["kiểu 'any'", /:\s*any\b|\bas any\b|<any>/g, { code: true }],
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/g, { code: true }],
  ['mã enum lộ ra giao diện', />[^<{]*\b(GRADE_\d+|PUBLISHED|DRAFT|ARCHIVED)\b[^<{]*</g, { code: true }],
  ['khẩu hiệu/số liệu nghi bịa', /số 1|hàng đầu|\d[\d.,]*\+?\s*(học sinh|người dùng|bài học)\b/g, { code: true }],
  ['emoji làm biểu tượng', /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, { code: true }],
  ['<img> không alt (kể cả nhiều dòng)', /<img\b(?![^>]*\balt=)[^>]*>/gs, { code: true }],
];

const result = new Map(rules.map((r) => [r[0], []]));
for (const f of files) {
  const isCss = f.endsWith('.css');
  const text = readFileSync(f, 'utf8');
  for (const [name, re, opt] of rules) {
    if (opt?.code && isCss) continue;
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split('\n').length;
      const lineText = text.split('\n')[line - 1] ?? '';
      if (isCss && /^\s*--[\w-]+\s*:/.test(lineText)) continue; // khai báo token trong CSS
      if (/audit-ignore/.test(lineText)) continue;
      result.get(name).push(`${relative(process.cwd(), f)}:${line}`);
    }
  }
}

console.log('== Kiểm tra giao diện ==');
let bad = 0;
for (const [name, hits] of result) {
  console.log(`${name.padEnd(36)} ${String(hits.length).padStart(5)}`);
  if (hits.length) { bad += hits.length; hits.slice(0, 5).forEach((h) => console.log('    ' + h)); if (hits.length > 5) console.log(`    ... (${hits.length - 5} chỗ nữa)`); }
}
const css = 'apps/web/app/globals.css';
if (existsSync(css)) console.log(`\nglobals.css: ${readFileSync(css, 'utf8').split('\n').length} dòng (mục tiêu < 200)`);
console.log(bad === 0 ? 'OK' : 'Có mục cần xem lại (0 là tốt). Thêm "audit-ignore" vào cuối dòng để bỏ qua trường hợp hợp lệ.');
