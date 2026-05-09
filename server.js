import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import connectDB from "./config/mongodb.js";
import userRouter from "./routes/userRoute.js";
import chatRouter from "./routes/chatRoute.js";
import messageRouter from "./routes/messageRoute.js";
import { notFound, errorHandler } from "./middleware/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
connectDB();

// ── Ensure uploads folder exists ──
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ── Multer config ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("File type not allowed"), false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.FRONTEND_URL
    ].filter(Boolean)
}));

// ── Serve uploaded files as static ──
app.use("/uploads", express.static(uploadDir));

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

app.get("/", (req, res) => res.send("Live Chat API is running..."));

app.use(notFound);
app.use(errorHandler);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
            process.env.FRONTEND_URL
        ].filter(Boolean)
    },
    pingTimeout: 60000
});

const userSocketMap = {};

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("setup", (userData) => {
        if (!userData || !userData._id) return;
        socket.join(userData._id.toString());
        userSocketMap[userData._id.toString()] = socket.id;
        socket.emit("connected");
        console.log("User setup:", userData._id, "→", socket.id);
    });

    socket.on("join chat", (room) => { if (room) socket.join(room); });

    socket.on("new message", (newMessage) => {
        if (!newMessage?.chat?.users) return;
        newMessage.chat.users.forEach((user) => {
            if (!user?._id) return;
            if (user._id.toString() === newMessage.sender._id.toString()) return;
            socket.in(user._id.toString()).emit("message received", newMessage);
        });
    });

    socket.on("typing", (room) => { if (room) socket.in(room).emit("typing"); });
    socket.on("stop typing", (room) => { if (room) socket.in(room).emit("stop typing"); });

    socket.on("get-socket-id", (userId, callback) => {
        callback(userSocketMap[userId?.toString()] || null);
    });

    socket.on("call:initiate", (data) => { if (data?.toSocketId) io.to(data.toSocketId).emit("call:incoming", data); });
    socket.on("call:accepted", (data) => { if (data?.toSocketId) io.to(data.toSocketId).emit("call:accepted", data); });
    socket.on("call:rejected", (data) => { if (data?.toSocketId) io.to(data.toSocketId).emit("call:ended"); });
    socket.on("call:ended", (data) => { if (data?.toSocketId) io.to(data.toSocketId).emit("call:ended"); });

    socket.on("disconnect", () => {
        Object.keys(userSocketMap).forEach((uid) => {
            if (userSocketMap[uid] === socket.id) delete userSocketMap[uid];
        });
        console.log("Socket disconnected:", socket.id);
    });
});

httpServer.listen(port, () => console.log(`Server running on http://localhost:${port}`));