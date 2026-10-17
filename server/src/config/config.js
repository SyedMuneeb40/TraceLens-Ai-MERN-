
const requiredEnvironmentVariables = [
    "CLOUD_MONGO_URI",
    "ACCESSTOKEN_SECRET",
    "REFRESHTOKEN_SECRET",
    "FRONTEND_URL",
    "OPENROUTER_API_KEY",
    "OPENROUTER_MODEL",
    "BREVO_API_KEY",
    "BREVO_USER",
    "SENDER_EMAIL"
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
