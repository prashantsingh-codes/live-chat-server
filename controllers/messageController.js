import messageModel from "../models/messageModel.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";

const allMessages = async (req, res) => {
    try {
        const messages = await messageModel.find({ chat: req.params.chatId })
            .populate("sender", "name email")
            .populate("receiver")
            .populate("chat");
        res.json({ success: true, messages });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { content, chatId } = req.body;

        // Allow message with either text OR media (or both)
        const hasMedia = !!req.file;
        if (!content && !hasMedia) {
            return res.json({ success: false, message: "Invalid data" });
        }
        if (!chatId) {
            return res.json({ success: false, message: "chatId is required" });
        }

        // Build media fields if file was uploaded
        let mediaUrl = null;
        let mediaType = null;
        if (hasMedia) {
            mediaUrl = `/uploads/${req.file.filename}`;
            mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
        }

        let message = await messageModel.create({
            sender: req.user._id,
            content: content || "",
            chat: chatId,
            mediaUrl,
            mediaType,
        });

        message = await message.populate("sender", "name");
        message = await message.populate("chat");
        message = await message.populate("receiver");
        message = await userModel.populate(message, {
            path: "chat.users",
            select: "name email"
        });

        await chatModel.findByIdAndUpdate(chatId, { latestMessage: message });
        res.json({ success: true, message });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { allMessages, sendMessage };