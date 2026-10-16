const evaluationDataset = [
    {
        caseId: "TC-001",
        expectedCause: "Database connection timeout",
        expectedKeywords: ["database", "connection", "timeout"],
        logs: [
            {
                sourceLineId: "TC001-L1",
                level: "error",
                message: "MongoServerSelectionError: Server selection timed out",
                timestamp: null,
                endpoint: null,
                requestId: null,
                stackTrace: null
            },
            {
                sourceLineId: "TC001-L2",
                level: "error",
                message: "Database connection failed after timeout",
                timestamp: null,
                endpoint: null,
                requestId: null,
                stackTrace: null
            }
        ]
    },
    {
        caseId: "TC-002",
        expectedCause: "Missing API route",
        expectedKeywords: ["route", "endpoint", "404", "not found"],
        logs: [
            {
                sourceLineId: "TC002-L1",
                level: "error",
                message: "POST /api/orders returned HTTP 404 Not Found",
                timestamp: null,
                endpoint: "/api/orders",
                requestId: null,
                stackTrace: null
            }
        ]
    },
    {
        caseId: "TC-003",
        expectedCause: "Undefined variable access",
        expectedKeywords: ["undefined", "typeerror"],
        logs: [
            {
                sourceLineId: "TC003-L1",
                level: "error",
                message: "TypeError: Cannot read properties of undefined (reading 'price')",
                timestamp: null,
                endpoint: "/api/cart",
                requestId: null,
                stackTrace: "at addToCart (cartController.js:42:15)"
            }
        ]
    }
];

module.exports = evaluationDataset;