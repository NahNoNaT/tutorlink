#!/usr/bin/env node
/*
 Simple staged-files secret scanner.
 - Run: `npm run secret:scan`
 - Optional: wire into Git hooks via Husky.
*/

const { execSync } = require('child_process')
const { readFileSync, existsSync, statSync } = require('fs')
const path = require('path')

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACMRT', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.split(/\r?\n/).filter(Boolean)
  } catch {
    return []
  }
}

const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'dist',
  'build',
  'coverage',
]

const ALLOWED_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.md', '.txt', '.env', '.yml', '.yaml', '.toml', '.sql', '.css', '.scss'
])

const RULES = [
  { name: 'PrivateKeyBlock',  re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'AWSAccessKeyId',   re: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWSSecretKey',     re: /aws(.{0,20})?(secret|access)[^A-Za-z0-9\n]{0,3}([A-Za-z0-9\/+=]{40})/i },
  { name: 'GitHubToken',      re: /(ghp|github_pat)_[A-Za-z0-9_]{30,}/ },
  { name: 'GoogleAPIKey',     re: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'StripeSecret',     re: /(sk_live_|rk_live_|whsec_)[A-Za-z0-9]{10,}/ },
  { name: 'StripePublishable',re: /pk_live_[A-Za-z0-9]{10,}/ },
  { name: 'SlackToken',       re: /xox[abpr]-[A-Za-z0-9\-]{10,}/ },
  { name: 'SupabaseJWTLike',  re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/ },
  { name: 'GenericPwd',       re: /(password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/i },
  { name: 'GenericSecret',    re: /(secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]+['"]/i },
]

function shouldScan(file) {
  const rel = file.replace(/\\/g, '/')
  if (EXCLUDE_DIRS.some(d => rel.startsWith(d + '/') || rel.includes('/' + d + '/'))) return false
  const ext = path.extname(rel)
  if (!ALLOWED_EXT.has(ext)) return false
  try { if (statSync(file).size > 512 * 1024) return false } catch { return false }
  return true
}

function scanFile(file) {
  const content = readFileSync(file, 'utf8')
  const findings = []
  for (const rule of RULES) {
    const m = content.match(rule.re)
    if (m) {
      findings.push({ rule: rule.name, sample: String(m[0]).slice(0, 80) })
    }
  }
  return findings
}

const files = getStagedFiles().filter(shouldScan)
let hits = []
for (const f of files) {
  if (!existsSync(f)) continue
  const findings = scanFile(f)
  if (findings.length) hits.push({ file: f, findings })
}

if (hits.length) {
  console.error('\n[secret-scan] Potential secrets detected in staged changes:')
  for (const h of hits) {
    console.error(`\n- ${h.file}`)
    for (const x of h.findings) {
      console.error(`  • ${x.rule}: ${x.sample}`)
    }
  }
  console.error('\nBlock the commit. If false-positive, adjust content or add safer placeholders.\n')
  process.exit(1)
} else {
  console.log('[secret-scan] No obvious secrets found in staged changes.')
}

