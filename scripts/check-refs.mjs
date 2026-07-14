import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function collectMarkdown(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'plans' || entry === '.claude')
      continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectMarkdown(full, acc);
    } else if (entry.endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function getHeadings(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const headings = new Set();
  for (const line of content.split('\n')) {
    const m = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (m) headings.add(slugify(m[1]));
  }
  return headings;
}

function resolveTarget(fromFile, fromLine, target, failures) {
  if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:'))
    return;

  let anchor = null;
  let pathPart = target;

  const hashIdx = target.indexOf('#');
  if (hashIdx !== -1) {
    pathPart = target.slice(0, hashIdx);
    anchor = target.slice(hashIdx + 1);
  }

  let targetFile;
  if (pathPart === '') {
    targetFile = fromFile;
  } else {
    targetFile = resolve(dirname(fromFile), pathPart.replace(/\//g, sep));
    if (!existsSync(targetFile)) {
      failures.push(`${fromFile}:${fromLine} BROKEN -> ${target}`);
      return;
    }
  }

  if (anchor) {
    const headings = getHeadings(targetFile);
    if (!headings.has(anchor)) {
      failures.push(`${fromFile}:${fromLine} BROKEN -> ${target} (anchor "#${anchor}" not found)`);
    }
  }
}

function checkFile(filePath, failures) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let refCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Markdown links: ](target) where target ends in .md or contains .md#
    for (const m of line.matchAll(/\]\(([^)]+)\)/g)) {
      const target = m[1];
      if (target.startsWith('#')) {
        // Same-file anchor
        const anchor = target.slice(1);
        const headings = getHeadings(filePath);
        if (!headings.has(anchor)) {
          failures.push(
            `${filePath}:${lineNum} BROKEN -> ${target} (anchor "#${anchor}" not found)`,
          );
        }
        refCount++;
      } else if (target.endsWith('.md') || target.includes('.md#')) {
        if (
          !target.startsWith('http://') &&
          !target.startsWith('https://') &&
          !target.startsWith('mailto:')
        ) {
          resolveTarget(filePath, lineNum, target, failures);
          refCount++;
        }
      }
    }

    // Backtick refs: `path.md` or `path.md#anchor` starting with references/, ../, or ./
    // For `references/...` paths, only check if this file's directory has a references/
    // subdirectory — otherwise the path is skill-relative (preceded by [skill-name]),
    // not file-relative, and the checker cannot resolve it.
    const hasRefsDir = existsSync(join(dirname(filePath), 'references'));
    for (const m of line.matchAll(/`([^`]*\.md(?:#[A-Za-z0-9-]+)?)`/g)) {
      const target = m[1];
      if (target.startsWith('references/')) {
        if (!hasRefsDir) continue; // skill-relative path, skip
        resolveTarget(filePath, lineNum, target, failures);
        refCount++;
      } else if (target.startsWith('../') || target.startsWith('./')) {
        resolveTarget(filePath, lineNum, target, failures);
        refCount++;
      }
    }
  }

  return refCount;
}

const files = [
  ...collectMarkdown(join(ROOT, 'skills')),
  ...collectMarkdown(join(ROOT, 'agents')),
  ...collectMarkdown(join(ROOT, '.claude', 'skills')),
  join(ROOT, 'README.md'),
  join(ROOT, 'CONTRIBUTING.md'),
].filter((f) => existsSync(f));

const failures = [];
let totalRefs = 0;

for (const file of files) {
  totalRefs += checkFile(file, failures);
}

// Static sentinel assert: mcp-router SKILL.md must not contain sentinel strings
const routerSkill = join(ROOT, 'skills', 'mcp-router', 'SKILL.md');
if (existsSync(routerSkill)) {
  const content = readFileSync(routerSkill, 'utf8');
  if (content.includes('</mcp-hub-router>')) {
    failures.push(`${routerSkill}: SENTINEL -> contains </mcp-hub-router>`);
  }
  if (content.includes('<system-reminder')) {
    failures.push(`${routerSkill}: SENTINEL -> contains <system-reminder`);
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(f);
  console.error(
    `check-refs: ${files.length} files, ${totalRefs} references, ${failures.length} broken`,
  );
  process.exit(1);
}

console.log(`check-refs: ${files.length} files, ${totalRefs} references, 0 broken`);
