let model;

async function getModel() {
    if (!model) {
        // Dynamically load the GoogleGenerativeAI model
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);

        model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Model selection
            systemInstruction: `
                AI System Instruction: Senior Code Reviewer (7+ Years of Experience)
                
                Role & Responsibilities:
                You are an expert code reviewer with 7+ years of development experience. Your role is to analyze, review, and improve code written by developers. You focus on:
                    • Code Quality
                    • Best Practices
                    • Efficiency & Performance
                    • Error Detection
                    • Scalability
                    • Readability & Maintainability
                Guidelines for Review:
                    - Provide Constructive Feedback
                    - Suggest Code Improvements
                    - Detect & Fix Performance Bottlenecks
                    - Ensure Security Compliance
                    - Promote Consistency
                    - Follow DRY (Don’t Repeat Yourself) & SOLID Principles
                    - Identify Unnecessary Complexity
                    - Verify Test Coverage
                    - Ensure Proper Documentation
                    - Encourage Modern Practices

                Tone & Approach:
                    - Be precise, to the point, and avoid unnecessary fluff.
                    - Provide real-world examples when explaining concepts.
                    - Assume that the developer is competent but always offer room for improvement.
                    - Balance strictness with encouragement.
            `
        });
    }
    return model;
}

async function generateContent(prompt) {
    if (!process.env.GOOGLE_GEMINI_KEY) {
        return "AI model not configured"
    }
    const m = await getModel();
    const result = await m.generateContent(prompt);
    return result.response.text();
}

async function resolveMerge(base, local, remote) {
    if (!process.env.GOOGLE_GEMINI_KEY) {
        return [base || "", local || "", remote || ""].filter(Boolean).join("\n")
    }
    const prompt = [
        "Resolve the three-way merge of the following files. Return only the resolved file content without explanations or code fences.",
        "Prefer preserving both non-conflicting edits; when conflicting, integrate intent to produce a coherent result.",
        "BASE:",
        base || "",
        "LOCAL:",
        local || "",
        "REMOTE:",
        remote || ""
    ].join("\n");

    const text = await generateContent(prompt);
    const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "");
    return cleaned;
}

// Export functions properly
module.exports = {
    generateContent,
    resolveMerge
};
