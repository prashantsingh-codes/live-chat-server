import chatModel from "../models/chatModel.js";
import userModel from "../models/userModel.js";

const accessChat = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.json({ success: false, message: "UserId not provided" });
        }
        let isChat = await chatModel.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } }
            ]
        }).populate("users", "-password").populate("latestMessage");

        isChat = await userModel.populate(isChat, {
            path: "latestMessage.sender",
            select: "name email"
        });

        if (isChat.length > 0) {
            return res.json({ success: true, chat: isChat[0] });
        }

        const createdChat = await chatModel.create({
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId]
        });
        const fullChat = await chatModel.findById(createdChat._id).populate("users", "-password");
        res.json({ success: true, chat: fullChat });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const fetchChats = async (req, res) => {
    try {
        let results = await chatModel.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        results = await userModel.populate(results, {
            path: "latestMessage.sender",
            select: "name email"
        });
        res.json({ success: true, chats: results });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const fetchGroups = async (req, res) => {
    try {
        const allGroups = await chatModel.find({ isGroupChat: true });
        res.json({ success: true, groups: allGroups });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const createGroupChat = async (req, res) => {
    try {
        const { users, name } = req.body;
        if (!name) {
            return res.json({ success: false, message: "Group name is required" });
        }
        let parsedUsers = users ? JSON.parse(users) : [];
        // always add the creator
        parsedUsers.push(req.user._id);

        const groupChat = await chatModel.create({
            chatName: name,
            users: parsedUsers,
            isGroupChat: true,
            groupAdmin: req.user
        });
        const fullGroupChat = await chatModel.findById(groupChat._id)
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.json({ success: true, chat: fullGroupChat });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const joinGroup = async (req, res) => {
    try {
        const { chatId } = req.body;
        const chat = await chatModel.findById(chatId);
        if (!chat) {
            return res.json({ success: false, message: "Group not found" });
        }
        // check if user already a member
        const alreadyMember = chat.users.some(
            u => u.toString() === req.user._id.toString()
        );
        if (alreadyMember) {
            const fullChat = await chatModel.findById(chatId)
                .populate("users", "-password")
                .populate("groupAdmin", "-password");
            return res.json({ success: true, chat: fullChat });
        }
        const updatedChat = await chatModel.findByIdAndUpdate(
            chatId,
            { $push: { users: req.user._id } },
            { new: true }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        res.json({ success: true, chat: updatedChat });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const groupExit = async (req, res) => {
    try {
        const { chatId, userId } = req.body;
        const removed = await chatModel.findByIdAndUpdate(
            chatId,
            { $pull: { users: userId } },
            { new: true }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        if (!removed) {
            return res.json({ success: false, message: "Chat not found" });
        }
        res.json({ success: true, chat: removed });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { accessChat, fetchChats, fetchGroups, createGroupChat, joinGroup, groupExit };
