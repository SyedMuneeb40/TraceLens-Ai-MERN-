const EMBEDDING_DIMENSIONS = 768;
const GEMINI_MODEL = "gemini-embedding-001";

const generateEmbedding = async (text) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Text is required to generate an embedding.");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: `models/${GEMINI_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding generation failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const embedding = data.embedding?.values;

  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Invalid embedding returned.");
  }

  return embedding;
};

module.exports = generateEmbedding;