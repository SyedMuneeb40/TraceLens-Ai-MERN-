const mongoose = require("mongoose");


const projectSchema = new mongoose.Schema(
    {
        owner:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        name:
        {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },
        description:
        {
            type:String,
            required: true,
            default: "",
            trim: true,
            maxlength: 500
        },
        environment:
        {
            type:String,
            enum:["development","staging","production"],
            default: "development",
            required: true
        },
    },
    {
        timestamps: true
    }
);

projectSchema.index({owner:1,createdAt:-1});

const Project = mongoose.model("Project",projectSchema);

module.exports = Project;
