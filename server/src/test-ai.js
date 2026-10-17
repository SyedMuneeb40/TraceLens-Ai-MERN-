
require("dotenv").config();

const 
  analyzeWithOpenRouter
 = require("./service/ai.service");

const evidence = [
  {
    sourceLineId: "L001",
    level: "ERROR",
    message: "POST /api/cart returned status 500",
    endpoint: "POST /api/cart",
    timestamp: null,
    requestId: null,
    stackTrace: null
  },
  {
    sourceLineId: "L002",
    level: null,
    message: "TypeError: Cannot read properties of undefined",
    endpoint: null,
    timestamp: null,
    requestId: null,
    stackTrace: null
  },
  {
    sourceLineId: "L003",
    level: null,
    message: "at addToCart (cartController.js:42:10)",
    endpoint: null,
    timestamp: null,
    requestId: null,
    stackTrace: "at addToCart (cartController.js:42:10)"
  }
];

analyzeWithOpenRouter({ currentEvidence: evidence, historicalContext: [] })
  .then((analysis) => {
    console.dir(analysis, { depth: null });
  })
  .catch((error) => {
    console.error("AI test failed:", error.message);
  });
