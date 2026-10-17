/**
 * TraceLens AI - Evaluation Dataset v2
 * 16 synthetic backend incidents (easy -> hard).
 *
 * Same shape as v1: caseId, expectedCause, expectedKeywords, logs[]
 * Extra OPTIONAL fields (safe to ignore if your evaluationService doesn't use them):
 *   - difficulty:          "easy" | "medium" | "hard"
 *   - category:            group name for per-category metrics
 *   - expectedEvidenceIds: lines that REALLY support the root cause (for grounding check)
 *   - expectInsufficient:  true => correct behaviour is to say "not enough evidence"
 */

// Helper: fills the nulls so every log has the exact schema shape.
const L = (sourceLineId, level, message, extra = {}) => ({
  sourceLineId,
  level,
  message,
  timestamp: extra.timestamp ?? null,
  endpoint: extra.endpoint ?? null,
  requestId: extra.requestId ?? null,
  stackTrace: extra.stackTrace ?? null,
});

const evaluationDataset = [
  {
    caseId: "TC-001",
    difficulty: "easy",
    category: "database",
    expectedCause: "Database connection timeout",
    expectedKeywords: ["database", "mongo", "connection", "timeout", "server selection"],
    expectedEvidenceIds: ["TC001-L2", "TC001-L3"],
    logs: [
      L("TC001-L1", "info", "Server starting on port 5000", { timestamp: "2026-10-17T10:00:00.000Z" }),
      L("TC001-L2", "error", "MongoServerSelectionError: Server selection timed out after 30000 ms", { timestamp: "2026-10-17T10:00:31.000Z" }),
      L("TC001-L3", "error", "Database connection failed after timeout", { timestamp: "2026-10-17T10:00:31.200Z" }),
    ],
  },
  {
    caseId: "TC-002",
    difficulty: "easy",
    category: "routing",
    expectedCause: "Missing API route",
    expectedKeywords: ["route", "endpoint", "404", "not found", "not registered", "not defined"],
    expectedEvidenceIds: ["TC002-L2"],
    logs: [
      L("TC002-L1", "info", "GET /api/products 200 12ms", { endpoint: "/api/products", requestId: "req-a11" }),
      L("TC002-L2", "error", "POST /api/orders returned HTTP 404 Not Found", { endpoint: "/api/orders", requestId: "req-a12" }),
      L("TC002-L3", "warn", "No route handler matched POST /api/orders", { endpoint: "/api/orders", requestId: "req-a12" }),
    ],
  },
  {
    caseId: "TC-003",
    difficulty: "easy",
    category: "runtime",
    expectedCause: "Undefined variable access",
    expectedKeywords: ["undefined", "typeerror", "price", "property", "missing"],
    expectedEvidenceIds: ["TC003-L1"],
    logs: [
      L("TC003-L1", "error", "TypeError: Cannot read properties of undefined (reading 'price')", {
        endpoint: "/api/cart",
        stackTrace: "at addToCart (cartController.js:42:15)\n    at Layer.handle [as handle_request] (express/lib/router/layer.js:95:5)",
      }),
    ],
  },
  {
    caseId: "TC-004",
    difficulty: "easy",
    category: "config",
    expectedCause: "Missing environment variable (JWT secret not set)",
    expectedKeywords: ["secret", "env", "environment", "jwt", "undefined", "not set", "missing"],
    expectedEvidenceIds: ["TC004-L2", "TC004-L3"],
    logs: [
      L("TC004-L1", "info", "POST /api/auth/login received", { endpoint: "/api/auth/login", requestId: "req-b01" }),
      L("TC004-L2", "error", "Error: secretOrPrivateKey must have a value", {
        endpoint: "/api/auth/login",
        requestId: "req-b01",
        stackTrace: "at Object.sign (jsonwebtoken/sign.js:105:20)\n    at generateAccessToken (authService.js:18:19)",
      }),
      L("TC004-L3", "debug", "process.env.JWT_ACCESS_SECRET = undefined", { requestId: "req-b01" }),
    ],
  },

  {
    caseId: "TC-005",
    difficulty: "medium",
    category: "runtime",
    expectedCause: "Null result not handled after database lookup",
    expectedKeywords: ["null", "findbyid", "not found", "check", "missing document", "does not exist"],
    expectedEvidenceIds: ["TC005-L2", "TC005-L3"],
    logs: [
      L("TC005-L1", "info", "GET /api/users/64f1c2aa9b1e8a0012345678 started", { endpoint: "/api/users/:id", requestId: "req-c10" }),
      L("TC005-L2", "debug", "User.findById(64f1c2aa9b1e8a0012345678) returned null", { requestId: "req-c10" }),
      L("TC005-L3", "error", "TypeError: Cannot read properties of null (reading 'email')", {
        endpoint: "/api/users/:id",
        requestId: "req-c10",
        stackTrace: "at getUserProfile (userController.js:27:31)",
      }),
    ],
  },
  {
    caseId: "TC-006",
    difficulty: "medium",
    category: "database",
    expectedCause: "Duplicate key violation on unique field",
    expectedKeywords: ["duplicate", "e11000", "unique", "already exists", "email"],
    expectedEvidenceIds: ["TC006-L1"],
    logs: [
      L("TC006-L1", "error", "MongoServerError: E11000 duplicate key error collection: tracelens.users index: email_1 dup key: { email: \"ali@example.com\" }", {
        endpoint: "/api/auth/register",
        requestId: "req-d05",
        stackTrace: "at createUser (authService.js:44:22)",
      }),
      L("TC006-L2", "error", "POST /api/auth/register responded 500", { endpoint: "/api/auth/register", requestId: "req-d05" }),
    ],
  },
  {
    caseId: "TC-007",
    difficulty: "medium",
    category: "validation",
    expectedCause: "Mongoose validation failure - required field missing",
    expectedKeywords: ["validation", "required", "path", "missing field", "owner"],
    expectedEvidenceIds: ["TC007-L1"],
    logs: [
      L("TC007-L1", "error", "ValidationError: Project validation failed: owner: Path `owner` is required.", {
        endpoint: "/api/projects",
        requestId: "req-e22",
        stackTrace: "at model.Document.invalidate (mongoose/lib/document.js:3150:32)\n    at createProject (projectService.js:19:5)",
      }),
      L("TC007-L2", "info", "Request body keys: name, description, environment", { endpoint: "/api/projects", requestId: "req-e22" }),
    ],
  },
  {
    caseId: "TC-008",
    difficulty: "medium",
    category: "auth",
    expectedCause: "Expired or invalid access token (secret redacted)",
    expectedKeywords: ["token", "expired", "jwt", "unauthorized", "401", "refresh"],
    expectedEvidenceIds: ["TC008-L2"],
    logs: [
      L("TC008-L1", "debug", "Authorization header: Bearer [REDACTED]", { endpoint: "/api/projects", requestId: "req-f31" }),
      L("TC008-L2", "error", "TokenExpiredError: jwt expired at 2026-10-17T09:45:00.000Z", {
        endpoint: "/api/projects",
        requestId: "req-f31",
        stackTrace: "at protect (middleware/protect.js:21:13)",
      }),
      L("TC008-L3", "warn", "GET /api/projects responded 401", { endpoint: "/api/projects", requestId: "req-f31" }),
    ],
  },
  {
    caseId: "TC-009",
    difficulty: "medium",
    category: "http",
    expectedCause: "Malformed JSON request body",
    expectedKeywords: ["json", "syntax", "malformed", "parse", "unexpected token", "body"],
    expectedEvidenceIds: ["TC009-L1"],
    logs: [
      L("TC009-L1", "error", "SyntaxError: Unexpected token } in JSON at position 54", {
        endpoint: "/api/auth/login",
        requestId: "req-g07",
        stackTrace: "at JSON.parse (<anonymous>)\n    at parse (body-parser/lib/types/json.js:92:19)",
      }),
      L("TC009-L2", "warn", "POST /api/auth/login responded 400", { endpoint: "/api/auth/login", requestId: "req-g07" }),
    ],
  },
  {
    caseId: "TC-010",
    difficulty: "medium",
    category: "http",
    expectedCause: "Uploaded file exceeds size limit",
    expectedKeywords: ["file", "size", "limit", "too large", "multer", "upload", "413"],
    expectedEvidenceIds: ["TC010-L1"],
    logs: [
      L("TC010-L1", "error", "MulterError: File too large (LIMIT_FILE_SIZE)", { endpoint: "/api/projects/:id/logs", requestId: "req-h14" }),
      L("TC010-L2", "info", "Upload attempt: app-server.log size=8.4MB, allowed=2MB", { endpoint: "/api/projects/:id/logs", requestId: "req-h14" }),
    ],
  },

  {
    caseId: "TC-011",
    difficulty: "hard",
    category: "noise",
    expectedCause: "Redis connection refused (not the deprecation warnings)",
    expectedKeywords: ["redis", "econnrefused", "connection refused", "cache", "not running", "unreachable"],
    expectedEvidenceIds: ["TC011-L4", "TC011-L5"],
    logs: [
      L("TC011-L1", "warn", "DeprecationWarning: Buffer() is deprecated due to security and usability issues"),
      L("TC011-L2", "warn", "Mongoose: the `strictQuery` option will be switched back to `false` by default in Mongoose 7"),
      L("TC011-L3", "info", "GET /api/dashboard 200 85ms", { endpoint: "/api/dashboard", requestId: "req-i01" }),
      L("TC011-L4", "error", "Error: connect ECONNREFUSED 127.0.0.1:6379", {
        endpoint: "/api/dashboard/stats",
        requestId: "req-i02",
        stackTrace: "at TCPConnectWrap.afterConnect (net.js:1157:16)\n    at cacheService.get (cacheService.js:12:9)",
      }),
      L("TC011-L5", "error", "Redis client error: stats cache unavailable, request failed", { endpoint: "/api/dashboard/stats", requestId: "req-i02" }),
      L("TC011-L6", "info", "Health check OK"),
    ],
  },
  {
    caseId: "TC-012",
    difficulty: "hard",
    category: "cascading",
    expectedCause: "Database connection pool exhausted (root cause); endpoint timeouts are only symptoms",
    expectedKeywords: ["pool", "exhausted", "connection", "root cause", "waitqueue", "too many", "leak"],
    expectedEvidenceIds: ["TC012-L1", "TC012-L2"],
    logs: [
      L("TC012-L1", "error", "MongoWaitQueueTimeoutError: Timed out while checking out a connection from connection pool (maxPoolSize=10)", { timestamp: "2026-10-17T11:02:10.000Z" }),
      L("TC012-L2", "warn", "Connection pool at capacity: 10/10 in use, 37 requests waiting", { timestamp: "2026-10-17T11:02:11.000Z" }),
      L("TC012-L3", "error", "GET /api/incidents timed out after 30000ms", { endpoint: "/api/incidents", timestamp: "2026-10-17T11:02:41.000Z" }),
      L("TC012-L4", "error", "POST /api/projects/:id/logs timed out after 30000ms", { endpoint: "/api/projects/:id/logs", timestamp: "2026-10-17T11:02:42.000Z" }),
      L("TC012-L5", "error", "GET /api/auth/me timed out after 30000ms", { endpoint: "/api/auth/me", timestamp: "2026-10-17T11:02:43.000Z" }),
    ],
  },
  {
    caseId: "TC-013",
    difficulty: "hard",
    category: "external-service",
    expectedCause: "Third-party API rate limit exceeded (HTTP 429) - no retry/backoff",
    expectedKeywords: ["429", "rate limit", "too many requests", "third-party", "external", "backoff", "retry", "quota"],
    expectedEvidenceIds: ["TC013-L2", "TC013-L3"],
    logs: [
      L("TC013-L1", "info", "Sending verification email via provider API", { endpoint: "/api/auth/resend-otp", requestId: "req-j40" }),
      L("TC013-L2", "error", "HTTP 429 Too Many Requests from email provider: daily sending quota exceeded", { endpoint: "/api/auth/resend-otp", requestId: "req-j40" }),
      L("TC013-L3", "error", "emailService.sendOtp failed: no retry configured", {
        requestId: "req-j40",
        stackTrace: "at sendOtp (emailService.js:33:11)",
      }),
      L("TC013-L4", "warn", "Users reporting OTP not received (12 reports in 10 min)"),
    ],
  },
  {
    caseId: "TC-014",
    difficulty: "hard",
    category: "resources",
    expectedCause: "Node.js out of memory - heap limit reached (possible memory leak)",
    expectedKeywords: ["memory", "heap", "out of memory", "leak", "allocation failed", "oom"],
    expectedEvidenceIds: ["TC014-L2", "TC014-L3"],
    logs: [
      L("TC014-L1", "warn", "Memory usage: heapUsed=1.62GB / heapTotal=1.98GB", { timestamp: "2026-10-17T12:30:00.000Z" }),
      L("TC014-L2", "error", "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory", { timestamp: "2026-10-17T12:31:12.000Z" }),
      L("TC014-L3", "error", "Cache Map size = 2,481,903 entries, no eviction policy", { timestamp: "2026-10-17T12:31:12.100Z" }),
      L("TC014-L4", "info", "Process exited with code 134; restarting", { timestamp: "2026-10-17T12:31:13.000Z" }),
    ],
  },
  {
    caseId: "TC-015",
    difficulty: "hard",
    category: "http",
    expectedCause: "CORS policy blocking frontend origin (CLIENT_URL mismatch)",
    expectedKeywords: ["cors", "origin", "blocked", "allowed", "client_url", "access-control", "mismatch"],
    expectedEvidenceIds: ["TC015-L1", "TC015-L2"],
    logs: [
      L("TC015-L1", "error", "CORS: origin https://tracelens-app.netlify.app/ not allowed", { endpoint: "/api/auth/login", requestId: "req-k09" }),
      L("TC015-L2", "debug", "Configured CLIENT_URL = https://tracelens-app.netlify.app (no trailing slash)"),
      L("TC015-L3", "warn", "OPTIONS /api/auth/login responded 500", { endpoint: "/api/auth/login", requestId: "req-k09" }),
      L("TC015-L4", "info", "GET /api/health 200 3ms", { endpoint: "/api/health" }),
    ],
  },

  {
    caseId: "TC-016",
    difficulty: "hard",
    category: "insufficient-evidence",
    expectInsufficient: true,
    expectedCause: "Insufficient evidence - cause cannot be determined from these logs",
    expectedKeywords: ["insufficient", "not enough", "unknown", "cannot determine", "more information", "missing"],
    expectedEvidenceIds: [],
    logs: [
      L("TC016-L1", "error", "Internal Server Error", { endpoint: "/api/checkout", requestId: "req-z99" }),
      L("TC016-L2", "info", "POST /api/checkout responded 500", { endpoint: "/api/checkout", requestId: "req-z99" }),
    ],
  },
];

module.exports = evaluationDataset;