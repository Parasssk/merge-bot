const gitService = require('../services/git.service')

module.exports.listBranches = async (req, res) => {
  try {
    const repoPath = process.env.REPO_ROOT || process.cwd()
    const data = await gitService.listBranches(repoPath)
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal Server Error' })
  }
}

module.exports.previewMerge = async (req, res) => {
  try {
    const repoPath = process.env.REPO_ROOT || process.cwd()
    const { baseBranch, targetBranch } = req.body || {}
    if (!baseBranch || !targetBranch) return res.status(400).json({ error: 'baseBranch and targetBranch are required' })
    const data = await gitService.previewMerge(repoPath, baseBranch, targetBranch)
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal Server Error' })
  }
}
