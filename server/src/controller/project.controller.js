const {create,getProjectById,getProjects,updateProject,deleteProject} = require("../service/project.service.js")



const createProject = async (req,res,next)=>{
    try{

        const userId = req.user.id;
        const data = req.body;

        const project = await create(userId,data);

        return res.status(201).json({success:true, message: "Project Created Successfully ", project: project});

    }catch(error){
        next(error);
    }
};


const getAllProjects = async (req,res,next) => {
    try{

        const userId = req.user.id;
        const projects = await getProjects(userId);

        return res.status(200).json({success:true, message: "Successfully Get List Of Projects",count: projects.length, projects: projects});

    }catch(error){
        next(error);
    }
};


const getProject = async (req,res,next)=>{
    try{
        const userId = req.user.id;
        const projectId = req.params.projectId;

        const project = await getProjectById(userId,projectId);

        return res.status(200).json({success:true, message: "Successfully Get Project By Id", project});

    }catch(error){
        next(error);
    }
};


const update = async (req,res,next)=>{
    try{
        const userId = req.user.id;
        const projectId = req.params.projectId;
        const data = req.body;

        const updatedProject = await updateProject(userId,projectId,data);

        return res.status(200).json({success:true, message: "Successfully Updated Project ",updatedProject});

    }catch(error){
        next(error);
    }
};

const remove = async (req,res,next)=>{
    try{
        const userId = req.user.id;
        const projectId = req.params.projectId;

        const deletedProject = await deleteProject(userId,projectId);
        return res.status(200).json({success:true, message: "Successfully Deleted Project ",deletedProject});

    }catch(error){
        next(error);
    }
}

module.exports = {createProject,getAllProjects,getProject,update,remove};