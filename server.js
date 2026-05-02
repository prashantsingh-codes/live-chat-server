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

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("setup", (userData) => {
        if (!userData || !userData._id) {
            console.log("Setup failed: invalid userData", userData);
            return;
        }
        socket.join(userData._id.toString());
        socket.emit("connected");
        console.log("User setup complete:", userData._id);
    });

    socket.on("join chat", (room) => {
        if (!room) {
            console.log("Join chat failed: no room provided");
            return;
        }
        socket.join(room);
        console.log("User joined room:", room);
    });

    socket.on("new message", (newMessage) => {
        if (!newMessage || !newMessage.chat) {
            console.log("new message failed: invalid message", newMessage);
            return;
        }

        const chat = newMessage.chat;

        if (!chat.users || !Array.isArray(chat.users)) {
            console.log("chat.users not defined or not an array");
            return;
        }

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

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

httpServer.listen(port, () =>
    console.log(`Server running on http://localhost:${port}`)
);