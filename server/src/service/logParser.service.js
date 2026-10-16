const crypto = require("crypto");

const parseLogs = (sanitizedText)=>{

    if(typeof sanitizedText !== "string" || !sanitizedText.trim()){
        throw new Error("Logs cannot be empty.")
    }

    const lines = sanitizedText.split(/\r?\n/)
    .filter((line) => line.trim() !== "" );

    const evidence = lines.map((line)=>{
        const timestampMatch = line.match(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})\b/);
        const levelMatch = line.match(/\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i);
        const endpointMatch = line.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s]*)/i);
        const requestIdMatch = line.match(/\b(?:requestId|request_id|correlationId)\s*[:=]\s*([^\s,;]+)/i);
  
        return {
            sourceLineId: crypto.randomUUID(),
            timestamp: timestampMatch ? new Date(timestampMatch[0]) : null,
            level: levelMatch ? levelMatch[0].toUpperCase() : null,
            message: line.trim(),
            endpoint: endpointMatch ? `${endpointMatch[1].toUpperCase()} ${endpointMatch[2]}`:null,
            requestId: requestIdMatch ? requestIdMatch[1] : null,
            stackTrace: /\bat\s+.+\(.+:\d+:\d+\)/.test(line) ? line.trim() : null 
        };
    });

    return evidence;
};

module.exports = parseLogs;