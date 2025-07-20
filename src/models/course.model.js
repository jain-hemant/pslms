import mongoose from "mongoose";

const courseSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", // This correctly references your UserModel
        required: true
    },
    duration: { // Consider storing this as a number (e.g., in minutes) for easier calculations
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
    },
    thumbnail: {
        type: String,
        default: "https://example.com/default-thumbnail.png"
    },
    isPublished: { // Added to allow for draft vs. published courses
        type: Boolean,
        default: false,
    },
    isActive: { // To allow for archiving or temporarily disabling a course
        type: Boolean,
        default: true
    },
}, { versionKey: false, timestamps: true });

const CourseModel = mongoose.models.course || mongoose.model("course", courseSchema);
export default CourseModel;