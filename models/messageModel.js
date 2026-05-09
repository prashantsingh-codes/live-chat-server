import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true, default: "" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    mediaUrl: { type: String, default: null },      // path to uploaded file
    mediaType: { type: String, default: null },     // "image" or "video"
}, { timestamps: true });

const messageModel = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default messageModel;