import mongoose from "mongoose";

const enrollmentSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
        required: true,
    },
    enrollmentDate: {
        type: Date,
        default: Date.now,
    },
    progress: { // A map to track completed lectures
        type: Map,
        of: Boolean, // e.g., { "lectureId1": true, "lectureId2": false }
        default: {},
    },
    completionStatus: {
        type: String,
        enum: ["not_started", "in_progress", "completed"],
        default: "not_started",
    }
}, { versionKey: false, timestamps: true });

// Ensure a student can only enroll in a course once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const EnrollmentModel = mongoose.models.enrollment || mongoose.model("enrollment", enrollmentSchema);
export default EnrollmentModel;