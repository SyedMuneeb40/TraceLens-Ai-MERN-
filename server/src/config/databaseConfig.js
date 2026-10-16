const mongoose = require("mongoose");


const dbConnect = async () => {
    try{
        await mongoose.connect(process.env.CLOUD_MONGO_URI);
        console.log("Successfully Connected to Database")
    }catch(error){
        console.log(error.message);
        console.log("Database Not Connected!!!!!!!!!");
        throw error;
    }
}

module.exports = dbConnect;