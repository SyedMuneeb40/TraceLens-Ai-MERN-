
const requiredEnvironmentVariables = [
    "CLOUD_MONGO_URI",
    "ACCESSTOKEN_SECRET",
    "REFRESHTOKEN_SECRET",
    "OLLAMA_MODEL",
    "OLLAMA_BASE_URL",
    "FRONTEND_URL"
];

const config = ()=>{
    const missingVariables = requiredEnvironmentVariables.filter(
        (name) => !process.env[name]
    );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );
    }
};

module.exports = config;
