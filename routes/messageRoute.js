import express from "express";
import { allMessages, sendMessage } from "../controllers/messageController.js";
import authUser from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:chatId", authUser, allMessages);
messageRouter.post("/", authUser, sendMessage);

export default messageRouter;
