const express = require('express')
const gitController = require('../controllers/git.controller')

const router = express.Router()

router.get('/branches', gitController.listBranches)
router.post('/preview-merge', gitController.previewMerge)

module.exports = router
