const mongoose = require("mongoose");
const bcrypt = require("bcrypt")


const userSchema = new mongoose.Schema(
    {
        username:
        {
            type: String,
            required: [true,"Username must be Required"],
            unique:true,
            trim: true,
            lowercase: true
        },
        email:
        {
            type: String,
            required: [true,"Email must be Required"],
            unique: true,
            trim: true,
            lowercase: true
        },
        password:
        {
            type: String,
            required: true,
            select: false
        },
        role:
        {
            type: String,
            enum: ["admin","user"],
            default: "user"
        }
    },
    {
        timestamps:true,
    }
);


userSchema.pre("save", async function (){
    if(!this.isModified("password")){
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


const User = mongoose.model("User",userSchema);

module.exports = User; 