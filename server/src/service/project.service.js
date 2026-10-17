const Project = require("../models/Project.js");
const Incident = require("../models/Incident.js");
const Analysis = require("../models/Analysis.js");
const mongoose = require("mongoose");

const createError = (message,statusCode = 400)=>{
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};


const isIdValid = (id)=>{
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw createError("Id is not valid/Mongo Formate")
    };
    return id;
};


const allowedEnvironments  = ["development","staging","production"];

const create = async (user_id,data)=>{
    const userId = user_id;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createError("Project data must be a valid object.");
    }

    if (typeof data.name !== "string") {
        throw createError("Project name must be a string.");
    }

    if (
        data.description !== undefined &&
        typeof data.description !== "string"
    ) {
        throw createError("Description must be a string.");
    }

    if (
        data.environment !== undefined &&
        typeof data.environment !== "string"
    ) {
        throw createError("Environment must be a string.");
    }
    
    const name = data.name?.trim();
    const description = data.description?.trim() ?? "";
    const environment = data.environment?.trim() ?? "development";

    if(!name || name.length < 2 || name.length > 100){
        throw createError("Project name must be between 2 and 100 characters.")
    }

    if(typeof description !== "string" || description.length > 500){
        throw createError("Description must not exceed 500 characters.")
    }

    if(!allowedEnvironments.includes(environment)){
        throw createError("Environment must be development, staging, or production.")
    }

    isIdValid(user_id);

    const project = await Project.create(
        {
            owner: userId,
            name,
            description,
            environment
        }
    );

    return project;
};


const getProjectById = async (user_id , project_id)=>{
    isIdValid(user_id);
    isIdValid(project_id);

    const existingProject = await Project.findOne(
        {
            owner: user_id,
            _id:project_id
        }
    );

    if(!existingProject){
        throw createError("Project Not Found With This Id" , 404)
    }

    return existingProject;
}

const getProjects = async (user_id)=>{
    isIdValid(user_id);

    const allProjects = await Project.find(
        {
            owner: user_id
        }
    ).sort({updatedAt: -1});

    return allProjects;
}


const updateProject = async (user_id,project_id,data)=>{
    isIdValid(user_id);
    isIdValid(project_id);

    const updatedData = {};

    if (data?.name !== undefined) {
        if (typeof data.name !== "string") {
            throw createError("Project name must be a string.");
        }

        const name = data.name.trim();

        if (name.length < 2 || name.length > 100) {
            throw createError("Project name must be between 2 and 100 characters.");
        }

        updatedData.name = name;
    }


    if (data?.description !== undefined) {
        if (typeof data.description !== "string") {
            throw createError("Description must be a string.");
        }

        const description = data.description.trim();

        if (description.length > 500) {
            throw createError("Description must not exceed 500 characters.");
        }

        updatedData.description = description;
    }

    if (data?.environment !== undefined) {
        if (
            typeof data.environment !== "string" ||
            !allowedEnvironments.includes(data.environment.trim())
        ) {
            throw createError(
                "Environment must be development, staging, or production."
            );
        }

        updatedData.environment = data.environment.trim();
    }

    if(Object.keys(updatedData).length === 0){
        throw createError("Provide at least one valid field to update.")
    }

    const updatedProject = await Project.findOneAndUpdate(
        {
            _id: project_id,
            owner: user_id
        },
        {
            $set:updatedData
        },
        {
            new:true,
            runValidators:true
        }
    );

    if(!updatedProject){
        throw createError("Project Not Found With This Id",404);
    }

    return updatedProject;
}

const deleteProject = async (user_id,project_id)=>{
    isIdValid(user_id);
    isIdValid(project_id);

    const project = await Project.findOne({
        _id: project_id,
        owner: user_id
    }).select("_id");

    if(!project){
        throw createError("Project not found.", 404);
    }

    // Project deletion removes owned incidents and analyses while retaining audit logs.
    const incidentIds = await Incident.distinct("_id", {
        project: project_id
    });

    if (incidentIds.length > 0) {
        await Analysis.deleteMany({ incident: { $in: incidentIds } });
    }

    await Incident.deleteMany({ project: project_id });

    const deletedProject = await Project.findOneAndDelete({
        _id: project_id,
        owner: user_id
    });

    if (!deletedProject) {
        throw createError("Project not found.", 404);
    }

    return deletedProject;
}


module.exports = {create,getProjectById,getProjects,updateProject,deleteProject};
