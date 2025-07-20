import mongoose from "mongoose";

const attendanceSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lecture",
        required: true,
    },
    course: { // Denormalizing for easier queries
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
        required: true,
    },
    status: {
        type: String,
        enum: ["present", "absent"],
        default: "present",
    },
    date: {
        type: Date,
        default: Date.now,
    }
}, { versionKey: false, timestamps: true });

// A student's attendance should be unique for a specific lecture
attendanceSchema.index({ student: 1, lecture: 1 }, { unique: true });

const AttendanceModel = mongoose.models.attendance || mongoose.model("attendance", attendanceSchema);
export default AttendanceModel;