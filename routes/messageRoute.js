import express from "express";
import { allMessages, sendMessage } from "../controllers/messageController.js";
import authUser from "../middleware/auth.js";
import { upload } from "../server.js";

const messageRouter = express.Router();

messageRouter.get("/:chatId", authUser, allMessages);
messageRouter.post("/", authUser, upload.single("media"), sendMessage);

export default messageRouter;