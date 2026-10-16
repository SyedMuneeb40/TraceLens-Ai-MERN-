
const config = ()=>{
    if(!process.env.PORT){
        return console.log(`Port number not found in Enviroment Varaible`)
    }
    if(!process.env.MONGO_URI){
        return console.log(`mongoDb Uri not found in Enviroment Varaible`)
    }
    if(!process.env.CLOUD_MONGO_URI){
        return console.log(`Cloud mongoDb Uri not found in Enviroment Varaible`)
    }
    if(!process.env.ACCESSTOKEN_SECRET){
        return console.log(`ACCESSTOKEN_SECRET not found in Enviroment Varaible`)
    }
    if(!process.env.REFRESHTOKEN_SECRET){
        return console.log(`REFRESHTOKEN_SECRET not found in Enviroment Varaible`)
    }
    if(!process.env.OLLAMA_MODEL){
        return console.log(`OLLAMA_MODEL not found in Enviroment Varaible`)
    }
    if(!process.env.OLLAMA_BASE_URL){
        return console.log(`OLLAMA_BASE_URL not found in Enviroment Varaible`)
    }
    if(!process.env.FRONTEND_URL){
        return console.log(`FRONTEND_URL not found in Enviroment Varaible`)
    }
}

module.exports = config;