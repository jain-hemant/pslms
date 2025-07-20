import mongoose from "mongoose";

const quizSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
        required: true,
    },
    lecture: { // A quiz can be linked to a specific lecture
        type: mongoose.Schema.Types.ObjectId,
        ref: "lecture",
    },
    dueDate: {
        type: Date,
    },
}, { versionKey: false, timestamps: true });

const QuizModel = mongoose.models.quiz || mongoose.model("quiz", quizSchema);
export default QuizModel;