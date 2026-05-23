import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        name: { 
            type: String, 
            required: true 
        },
        username: { 
            type: String, 
            required: true, 
            unique: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            sparse: true,
        },
        password: { 
            type: String, 
            required: true 
        },
        passwordHash: {
            type: String,
        },
        token: { 
            type: String 
        },
        role: {
            type: String,
            enum: ['user', 'host', 'admin'],
            default: 'user',
        },
        avatar: {
            type: String,
            default: null,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        }
    }
)

// Check if model already exists before creating it
const User = mongoose.models.User || mongoose.model("User", userSchema);

export { User };