import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/mongodb.js";
import userRouter from "./routes/userRoute.js";
import chatRouter from "./routes/chatRoute.js";
import messageRouter from "./routes/messageRoute.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();
const port = process.env.PORT || 5000;
connectDB();

app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.FRONTEND_URL
    ].filter(Boolean)
}));

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

// ── User socket map — outside connection handler so it persists ──
const userSocketMap = {};

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("setup", (userData) => {
        if (!userData || !userData._id) {
            console.log("Setup failed: invalid userData", userData);
            return;
        }
        socket.join(userData._id.toString());
        userSocketMap[userData._id.toString()] = socket.id; // track socket ID
        socket.emit("connected");
        console.log("User setup complete:", userData._id, "→ socket:", socket.id);
    });

    socket.on("join chat", (room) => {
        if (!room) return;
        socket.join(room);
        console.log("User joined room:", room);
    });

    socket.on("new message", (newMessage) => {
        if (!newMessage || !newMessage.chat) return;
        const chat = newMessage.chat;
        if (!chat.users || !Array.isArray(chat.users)) return;
        chat.users.forEach((user) => {
            if (!user || !user._id) return;
            if (user._id.toString() === newMessage.sender._id.toString()) return;
            socket.in(user._id.toString()).emit("message received", newMessage);
        });
    });

    socket.on("typing", (room) => {
        if (!room) return;
        socket.in(room).emit("typing");
    });

    socket.on("stop typing", (room) => {
        if (!room) return;
        socket.in(room).emit("stop typing");
    });

    // ── Get socket ID of a user ──
    socket.on("get-socket-id", (userId, callback) => {
        const socketId = userSocketMap[userId?.toString()];
        callback(socketId || null);
    });

    // ── Call signaling ──
    socket.on("call:initiate", (data) => {
        if (!data?.toSocketId) return;
        io.to(data.toSocketId).emit("call:incoming", data);
    });

    socket.on("call:accepted", (data) => {
        if (!data?.toSocketId) return;
        io.to(data.toSocketId).emit("call:accepted", data);
    });

    socket.on("call:rejected", (data) => {
        if (!data?.toSocketId) return;
        io.to(data.toSocketId).emit("call:ended");
    });

    socket.on("call:ended", (data) => {
        if (!data?.toSocketId) return;
        io.to(data.toSocketId).emit("call:ended");
    });

    // ── Disconnect ──
    socket.on("disconnect", () => {
        // Remove from userSocketMap
        Object.keys(userSocketMap).forEach((uid) => {
            if (userSocketMap[uid] === socket.id) {
                delete userSocketMap[uid];
                console.log("Removed user from socket map:", uid);
            }
        });
        console.log("Socket disconnected:", socket.id);
    });
});

httpServer.listen(port, () =>
    console.log(`Server running on http://localhost:${port}`)
);