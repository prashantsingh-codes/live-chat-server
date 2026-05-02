import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }
}, { timestamps: true });

const messageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default messageModel;
