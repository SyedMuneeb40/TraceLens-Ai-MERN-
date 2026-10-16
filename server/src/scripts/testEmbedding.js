const  generateEmbedding  = require("../service/embedding.service.js");

const testEmbedding = async () => {
    try {
        const vector = await generateEmbedding(
            "MongoDB connection timeout while processing an order"
        );

        console.log("Embedding generated successfully.");
        console.log("Vector dimensions:", vector.length);
        console.log("First 5 values:", vector.slice(0, 5));
    } catch (error) {
        console.error("Embedding test failed:", error.message);
    }
};

testEmbedding();