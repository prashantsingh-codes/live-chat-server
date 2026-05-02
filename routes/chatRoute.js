import express from "express";
import {
    accessChat,
    fetchChats,
    fetchGroups,
    createGroupChat,
    joinGroup,
    groupExit
} from "../controllers/chatController.js";
import authUser from "../middleware/auth.js";

const chatRouter = express.Router();

chatRouter.post("/", authUser, accessChat);
chatRouter.get("/", authUser, fetchChats);
chatRouter.post("/createGroup", authUser, createGroupChat);
chatRouter.get("/fetchGroups", authUser, fetchGroups);
chatRouter.post("/joinGroup", authUser, joinGroup);
chatRouter.put("/groupExit", authUser, groupExit);

export default chatRouter;
