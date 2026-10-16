const createIncidentFingerprint = require("./service/incidentFingerprint.service.js");

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

const third = createIncidentFingerprint({
  projectId: "project456",
  endpoint: "POST /api/cart",
  errorType: "TypeError",
  errorMessage: "Cannot read property 123 of undefined"
});

console.log("First:", first);
console.log("Second:", second);
console.log("Same project and normalized error:", first === second);
console.log("Different project:", first !== third);
