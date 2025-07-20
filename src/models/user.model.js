import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // Good practice to store emails in a consistent format
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["student", "teacher", "admin"], // Simplified roles for a typical LMS
        default: "student",
    },
    profilePicture: {
        type: String,
        default: "https://example.com/default-profile.png",
    },
    bio: { // Added for a richer user profile
        type: String,
        maxlength: 500,
    },
    dateOfBirth: {
        type: Date,
    },
    address: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    isActive: { // To handle soft deletes or banning users
        type: Boolean,
        default: true,
    },
}, { versionKey: false, timestamps: true });

const UserModel = mongoose.models.user || mongoose.model("user", userSchema);
export default UserModel;