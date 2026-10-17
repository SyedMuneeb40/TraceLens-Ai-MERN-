const test = require("node:test");
const assert = require("node:assert/strict");

const createIncidentFingerprint = require("../service/incidentFingerprint.service.js");
const parseLogs = require("../service/logParser.service.js");
const redactSecrets = require("../service/logRedaction.service.js");
const { cookieOptions } = require("../utils/jwtUtils.js");

test("refresh cookie matches the refresh token lifetime", () => {
    assert.equal(cookieOptions.httpOnly, true);
    assert.equal(cookieOptions.HttpOnly, undefined);
    assert.equal(cookieOptions.maxAge, 2 * 24 * 60 * 60 * 1000);
});

test("redacts bearer, key-value, and MongoDB credentials", () => {
    const rawLogs = [
        "Authorization: Bearer abc.def.ghi",
        "password=super-secret api_key='secret-key'",
        "mongodb+srv://user:password@example.test/db"
    ].join("\n");

    const redacted = redactSecrets(rawLogs);

    assert.doesNotMatch(redacted, /abc\.def\.ghi|super-secret|secret-key|:password@/);
    assert.match(redacted, /Bearer \[REDACTED\]/);
    assert.match(redacted, /password=\[REDACTED\]/);
});

test("parses timestamps, levels, endpoints, and stack traces", () => {
    const evidence = parseLogs([
        "2026-10-12T10:30:00Z ERROR POST /api/cart 500",
        "TypeError: Cannot read properties of undefined",
        "    at addToCart (cartController.js:42:10)"
    ].join("\n"));

    assert.equal(evidence.length, 3);
    assert.equal(evidence[0].level, "ERROR");
    assert.equal(evidence[0].endpoint, "POST /api/cart");
    assert.equal(evidence[0].timestamp.toISOString(), "2026-10-12T10:30:00.000Z");
    assert.equal(evidence[2].stackTrace, "at addToCart (cartController.js:42:10)");
    assert.ok(evidence.every((item) => item.sourceLineId));
});

test("normalizes numeric values in incident fingerprints", () => {
    const first = createIncidentFingerprint({
        projectId: "project123",
        endpoint: "POST /api/cart",
        errorType: "TypeError",
        errorMessage: "Cannot read property 123 of undefined"
    });
    const second = createIncidentFingerprint({
        projectId: "project123",
        endpoint: "POST /api/cart",
        errorType: "TypeError",
        errorMessage: "Cannot read property 456 of undefined"
    });
    const otherProject = createIncidentFingerprint({
        projectId: "project456",
        endpoint: "POST /api/cart",
        errorType: "TypeError",
        errorMessage: "Cannot read property 123 of undefined"
    });

    assert.equal(first, second);
    assert.notEqual(first, otherProject);
});
