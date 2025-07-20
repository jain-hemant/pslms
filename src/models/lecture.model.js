import mongoose from "mongoose";

const lectureSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
        required: true,
    },
    content: {
        type: String, // Can store text content or a URL to a video/resource
        required: true,
    },
    contentType: {
        type: String,
        enum: ["video", "text", "pdf", "quiz"],
        default: "video",
    },
    order: { // To define the sequence of lectures in a course
        type: Number,
        required: true,
    },
    duration: { // Duration in minutes
        type: Number,
        required: true,
    }
}, { versionKey: false, timestamps: true });

const LectureModel = mongoose.models.lecture || mongoose.model("lecture", lectureSchema);
export default LectureModel;