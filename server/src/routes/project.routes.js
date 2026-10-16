const express = require("express");
const {createProject,getProject,getAllProjects,update,remove} = require("../controller/project.controller.js")
const {protect , authorize} = require("../middlewares/authMiddleware.js")
const projectRoute = express.Router();



projectRoute.use(protect);

projectRoute.get("/",getAllProjects);
projectRoute.get("/:projectId",getProject);

projectRoute.post("/",createProject);
projectRoute.patch("/:projectId",update);
projectRoute.delete("/:projectId",remove);


module.exports = projectRoute;