const redactSecrets = require("./service/logRedaction.service.js")
const parseLogs = require("./service/logParser.service.js")


const logs = `
2026-10-12T10:30:00Z ERROR POST /api/cart 500
TypeError: Cannot read properties of undefined
    at addToCart (cartController.js:42:10)
`
const sanitizedLogs = redactSecrets(logs);
const evidence = parseLogs(sanitizedLogs);






console.dir(evidence, { depth: null });
