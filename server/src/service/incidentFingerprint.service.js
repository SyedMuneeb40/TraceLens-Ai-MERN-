const { error } = require("console");
const crypto = require("crypto");


const createIncidentFingerprint = ({projectId,endpoint,errorType,errorMessage})=>{

    const normalizedErrorMessage = (errorMessage || "")
                                                        .toLowerCase()
                                                        .replace(/0x[0-9a-f]+/gi, "<hex>")
                                                        .replace(/\b\d+\b/g, "<number>")
                                                        .replace(/\s+/g, " ")
                                                        .trim();

    const signature = [projectId,endpoint || "unknown-endpoint",errorType || "unknown-error",normalizedErrorMessage].join("|");
    return crypto.createHash("sha256").update(signature).digest("hex");
}

module.exports = createIncidentFingerprint;