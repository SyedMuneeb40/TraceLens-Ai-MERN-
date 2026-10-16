
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"
const generateEmbedding = async (text) => {
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("Text is required to generate an embedding.");
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "nomic-embed-text",
            input: text
        })
    });

    if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.embeddings?.[0];

    if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error("Ollama returned an invalid embedding.");
    }

    return embedding;
};

module.exports =  generateEmbedding ;
