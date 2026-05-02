import userModel from "../models/userModel.js";
import generateToken from "../config/generateToken.js";
import validator from "validator";

const loginUser = async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await userModel.findOne({ name });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }
        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: "All fields are required" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid email format" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters" });
        }
        const emailExists = await userModel.findOne({ email });
        if (emailExists) {
            return res.json({ success: false, message: "Email already registered" });
        }
        const nameExists = await userModel.findOne({ name });
        if (nameExists) {
            return res.json({ success: false, message: "Username already taken" });
        }
        const user = await userModel.create({ name, email, password });
        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const fetchAllUsers = async (req, res) => {
    try {
        const keyword = req.query.search ? {
            $or: [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } }
            ]
        } : {};
        const users = await userModel.find(keyword).find({ _id: { $ne: req.user._id } });
        res.json({ success: true, users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { loginUser, registerUser, fetchAllUsers };
