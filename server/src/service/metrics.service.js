const MAX_SAMPLES = 500;

const metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    errorRequests: 0,
    samples: []
};

const requestMetrics = (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1000000;
        const statusCode = res.statusCode;
        const route = req.route?.path
            ? `${req.method} ${req.baseUrl}${req.route.path}`
            : `${req.method} ${req.path}`;

        metrics.totalRequests += 1;
        if (statusCode >= 400) {
            metrics.errorRequests += 1;
        } else {
            metrics.successfulRequests += 1;
        }

        metrics.samples.push({
            durationMs: Number(durationMs.toFixed(2)),
            statusCode,
            route,
            createdAt: new Date()
        });

        if (metrics.samples.length > MAX_SAMPLES) {
            metrics.samples.shift();
        }
    });

    next();
};

const getMetrics = () => {
    const samples = [...metrics.samples];
    const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);
    const totalSampleRequests = samples.length;
    const p95Index = totalSampleRequests > 0
        ? Math.min(totalSampleRequests - 1, Math.floor(totalSampleRequests * 0.95))
        : 0;

    return {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        errorRequests: metrics.errorRequests,
        sampleSize: totalSampleRequests,
        averageResponseTimeMs: totalSampleRequests
            ? Number((durations.reduce((sum, duration) => sum + duration, 0) / totalSampleRequests).toFixed(2))
            : 0,
        p95ResponseTimeMs: totalSampleRequests ? durations[p95Index] : 0,
        recentRequests: samples.slice(-12).reverse()
    };
};

module.exports = { requestMetrics, getMetrics };
