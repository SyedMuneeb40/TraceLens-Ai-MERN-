const EvaluationRun = require("../models/EvaluationRun.js");

const getEvaluationRuns = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
        );

        const [runs, totalRuns] = await Promise.all([
            EvaluationRun.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            EvaluationRun.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            data: runs,
            latest: runs[0] || null,
            pagination: {
                currentPage: page,
                limit,
                totalRuns,
                totalPages: Math.ceil(totalRuns / limit)
            }
        });
    } catch (error) {
        console.error("Get evaluation runs error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch evaluation runs."
        });
    }
};

module.exports =  getEvaluationRuns ;
