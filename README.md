# 🖥️ LiveChat Server — REST API & Real-time Backend

> The backend powering LiveChat — a real-time chat and WebRTC video calling application. Built with Node.js, Express, Socket.io, and MongoDB. Deployed on AWS EC2 with GitHub Actions CI/CD.

[![Client Repo](https://img.shields.io/badge/Client_Repo-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/prashantsingh-codes/live-chat-client)
[![Live App](https://img.shields.io/badge/Live_App-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://livechat.lyxcorp.com/)

---

## 📸 What does this server do?

This is the backend for LiveChat. It handles user authentication, chat and group management, real-time messaging via Socket.io, WebRTC call signalling, and media file uploads via Multer. It runs on AWS EC2 behind Nginx, managed by PM2, and auto-deploys via GitHub Actions on every push to `main`.

---

## ✨ Features

### 🔐 Authentication
- JWT-based signup and login
- Passwords hashed with bcrypt
- Protected routes via auth middleware

### 💬 Messaging
- Send and fetch messages per chat
- Messages stored in MongoDB with sender and chat references
- Real-time delivery via Socket.io (`new message` event)
- **Typing indicators** — `typing` / `stop typing` socket events

### 📁 Media Uploads
- File and image uploads via **Multer**
- Uploaded files served statically from the server
- Circular import issue resolved by isolating multer into its own middleware

### 👥 Chats & Groups
- Create one-on-one chats
- Create group chats with a name and members
- Rename groups
- Add / remove members from groups
- Fetch all chats for a logged-in user

### 📞 WebRTC Call Signalling
- `call:initiate` — caller sends offer signal to receiver
- `call:accepted` — receiver sends answer signal back
- `call:rejected` — receiver declines the call
- `call:ended` — either party ends the call
- Server acts as a signalling relay — no media passes through the server

### ☁️ Deployment
- **AWS EC2** — server running via PM2 (auto-restart on crash)
- **Nginx** — reverse proxy, SSL termination
- **GitHub Actions** — SSH deploy on every push to `main`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 |
| Framework | Express 4 |
| Real-time | Socket.io |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcryptjs |
| File Uploads | Multer |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| Hosting | AWS EC2 |
| CI/CD | GitHub Actions |

---

## 📁 Project Structure

```
live-chat-server/
├── .github/workflows/      ← GitHub Actions deploy pipeline
├── config/
│   └── db.js               ← MongoDB connection
├── controllers/
│   ├── userController.js   ← Auth: register, login, search users
│   ├── chatController.js   ← One-on-one and group chat logic
│   └── messageController.js← Send and fetch messages
├── middleware/
│   ├── authMiddleware.js   ← JWT verification
│   └── uploadMiddleware.js ← Multer file upload config
├── models/
│   ├── userModel.js
│   ├── chatModel.js
│   └── messageModel.js
├── routes/
│   ├── userRoutes.js
│   ├── chatRoutes.js
│   └── messageRoutes.js
├── server.js               ← Express app + Socket.io setup
└── vercel.json
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repo

```bash
git clone https://github.com/prashantsingh-codes/live-chat-server.git
cd live-chat-server
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/livechat
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

### 3. Install and run

```bash
npm install
npm run dev
```

Server runs on **http://localhost:5000**

---

## 🗄️ API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/user/register` | — | Register new user |
| POST | `/api/user/login` | — | Login, returns JWT |
| GET | `/api/user?search=` | ✅ | Search users by name or email |

### Chats
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | ✅ | Create or fetch one-on-one chat |
| GET | `/api/chat` | ✅ | Get all chats for logged-in user |
| POST | `/api/chat/group` | ✅ | Create a group chat |
| PUT | `/api/chat/rename` | ✅ | Rename a group |
| PUT | `/api/chat/groupadd` | ✅ | Add member to group |
| PUT | `/api/chat/groupremove` | ✅ | Remove member from group |

### Messages
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/message` | ✅ | Send a message |
| GET | `/api/message/:chatId` | ✅ | Fetch all messages in a chat |

---

## ⚡ Socket.io Events

### Connection
| Event | Direction | Description |
|-------|-----------|-------------|
| `setup` | Client → Server | Register user's socket with their userId |
| `join chat` | Client → Server | Join a chat room |
| `disconnect` | Client → Server | User goes offline |

### Messaging
| Event | Direction | Description |
|-------|-----------|-------------|
| `new message` | Client → Server | Send a new message |
| `message received` | Server → Client | Deliver message to recipient |
| `typing` | Client → Server | User started typing |
| `stop typing` | Client → Server | User stopped typing |

### Calling (WebRTC Signalling)
| Event | Direction | Description |
|-------|-----------|-------------|
| `call:initiate` | Client → Server | Send WebRTC offer to receiver |
| `call:accepted` | Client → Server | Send WebRTC answer to caller |
| `call:rejected` | Client → Server | Notify caller of rejection |
| `call:ended` | Client → Server | Notify other party call ended |

---

## ⚙️ GitHub Actions — CI/CD

Every push to `main` automatically:
1. SSHs into the AWS EC2 instance
2. Pulls the latest code
3. Runs `npm install`
4. Restarts the server via PM2

Pipeline config lives in `.github/workflows/deploy.yml`.

---

## 🔗 Related

- **Frontend repo** → [live-chat-client](https://github.com/prashantsingh-codes/live-chat-client)
- **Live app** → [livechat.lyxcorp.com](https://livechat.lyxcorp.com/)

---

## 📄 License

MIT — free to use, modify, and deploy.

---

Built with ☕ by [Prashant Singh](https://www.linkedin.com/in/prashant-singh-079237192/)
