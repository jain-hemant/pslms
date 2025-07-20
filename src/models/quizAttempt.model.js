import mongoose from "mongoose";

const answerSchema = mongoose.Schema({
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "question",
        required: true,
    },
    selectedOption: String, // or an array for multiple correct answers
    isCorrect: Boolean,
}, { _id: false });

const quizAttemptSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "quiz",
        required: true,
    },
    answers: [answerSchema],
    score: {
        type: Number,
        required: true,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    }
}, { versionKey: false, timestamps: true });

const QuizAttemptModel = mongoose.models.quizAttempt || mongoose.model("quizAttempt", quizAttemptSchema);
export default QuizAttemptModel;