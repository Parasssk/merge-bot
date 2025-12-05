const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

function runGit(cwd, args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message))
      resolve(stdout)
    })
  })
}

async function ensureRepo(repoPath) {
  try {
    const root = (await runGit(repoPath, ['rev-parse', '--show-toplevel'])).trim()
    if (!root) throw new Error('Repository not found or inaccessible')
    const inside = (await runGit(root, ['rev-parse', '--is-inside-work-tree'])).trim()
    if (inside !== 'true') throw new Error('Not a git repository')
    return root
  } catch (e) {
    throw new Error('Repository not found or inaccessible')
  }
}

async function listBranches(repoPath) {
  const root = await ensureRepo(repoPath)
  const local = await runGit(root, ['branch', '--list'])
  const remote = await runGit(root, ['branch', '-r'])
  const normalize = s => s.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.replace(/^\*\s+/, ''))
  return { local: normalize(local), remote: normalize(remote) }
}

async function previewMerge(repoPath, baseBranch, targetBranch) {
  const root = await ensureRepo(repoPath)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mergebot-'))
  try {
    await runGit(root, ['clone', '-q', root, tmp])
    await runGit(tmp, ['checkout', baseBranch])
    let merged = false
    try {
      await runGit(tmp, ['merge', targetBranch, '--no-commit', '--no-ff'])
      merged = true
    } catch (_) {}
    const unmerged = await runGit(tmp, ['ls-files', '-u'])
    const lines = unmerged.split('\n').filter(Boolean)
    const files = {}
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 4) continue
      const stage = parts[2]
      const filePath = line.substring(line.indexOf(parts[3]))
      if (!files[filePath]) files[filePath] = { path: filePath }
      if (stage === '1') files[filePath].base = await runGit(tmp, ['show', `:1:${filePath}`]).catch(() => '')
      if (stage === '2') files[filePath].local = await runGit(tmp, ['show', `:2:${filePath}`]).catch(() => '')
      if (stage === '3') files[filePath].remote = await runGit(tmp, ['show', `:3:${filePath}`]).catch(() => '')
    }
    await runGit(tmp, ['merge', '--abort']).catch(() => {})
    const result = Object.values(files)
    if (merged && result.length === 0) return { files: [], message: 'No conflicts' }
    return { files: result }
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }) } catch (_) {}
  }
}

module.exports = { listBranches, previewMerge }
