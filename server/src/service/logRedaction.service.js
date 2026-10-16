

const redactSecrets = (rawText) => {

    if(typeof rawText !== "string"){
        throw new Error("Logs must be provided as text.")
    };

    let sanitizedText = rawText;

    //Authorization Redact like access-tokens

    sanitizedText = sanitizedText.replace(/\bBearer\s+[^\s"'`,]+/gi,"Bearer [REDACTED]");

    sanitizedText = sanitizedText.replace(/\b(password|passwd|pwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi,"$1=[REDACTED]");

    sanitizedText = sanitizedText.replace(/(mongodb(?:\+srv)?:\/\/[^:\s/@]+:)[^@\s/]+(@)/gi,"$1[REDACTED]$2")

    sanitizedText = sanitizedText.replace(/\b(AWS_SECRET_ACCESS_KEY|PRIVATE_KEY)\s*=\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi,"$1=[REDACTED]");

    return sanitizedText;
}


module.exports = redactSecrets;