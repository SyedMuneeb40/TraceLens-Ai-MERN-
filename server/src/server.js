require("dotenv").config();
const app = require("./app.js")
const dbConnect = require("./config/databaseConfig.js");
const config = require("./config/config.js");


const port = process.env.PORT || 5000;

try {
    config();

    dbConnect()
        .then(() => {
            app.listen(port,'0.0.0.0',()=>{
                console.log(`App Successfully Running on ${port}`)
            });
        })
        .catch(() => {
            process.exitCode = 1;
        });
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}

