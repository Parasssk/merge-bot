const aiService = require("../services/ai.service.js")

module.exports.getReview = async (req, res) => {
    try {
        const code = req.body.code
        if (!code) {
            return res.status(400).send("Prompt is required")
        }
        const response = await aiService.generateContent(code)
        res.send(response)
    } catch (err) {
        const message = typeof err === "string" ? err : err?.message || "Internal Server Error"
        res.status(500).json({ error: message })
    }
}

module.exports.resolveMerge = async (req, res) => {
    try {
        const { base, local, remote } = req.body
        if (!base || !local || !remote) {
            return res.status(400).json({ error: "base, local and remote are required" })
        }
        const merged = await aiService.resolveMerge(base, local, remote)
        res.send(merged)
    } catch (err) {
        const message = typeof err === "string" ? err : err?.message || "Internal Server Error"
        res.status(500).json({ error: message })
    }
}
