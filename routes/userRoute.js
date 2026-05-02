import express from "express";
import { loginUser, registerUser, fetchAllUsers } from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.get("/fetchUsers", authUser, fetchAllUsers);

export default userRouter;
