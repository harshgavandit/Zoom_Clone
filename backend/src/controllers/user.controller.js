import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_zoomclone_key_2026";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" })
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }

        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {
            // Sign stateless JWT token instead of saving random hex token to DB
            const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '7d' });
            
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token })
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
        }

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` })
    }
}

const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save();
        res.status(httpStatus.CREATED).json({ message: "User Registered" })

    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` })
    }
}

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        // Decode token to retrieve user details
        const decoded = jwt.verify(token, JWT_SECRET);
        const meetings = await Meeting.find({ user_id: decoded.username })
        res.json(meetings)
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` })
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const newMeeting = new Meeting({
            user_id: decoded.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();
        res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` })
    }
}

export { login, register, getUserHistory, addToHistory }