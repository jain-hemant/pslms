import mongoose from "mongoose";

const optionSchema = mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        required: true,
        default: false,
    }
}, { _id: false }); // _id is not needed for subdocuments here

const questionSchema = mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "quiz",
        required: true,
    },
    questionText: {
        type: String,
        required: true,
    },
    questionType: {
        type: String,
        enum: ["multiple_choice", "true_false", "short_answer"],
        required: true,
    },
    options: [optionSchema] // Array of possible answers for multiple choice
}, { versionKey: false, timestamps: true });

const QuestionModel = mongoose.models.question || mongoose.model("question", questionSchema);
export default QuestionModel;