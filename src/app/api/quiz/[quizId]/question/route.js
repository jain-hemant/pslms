import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import QuestionModel from '@/models/question.model';
import QuizModel from '@/models/quiz.model'; // Needed for auth check
import CourseModel from '@/models/course.model'; // Needed for auth check

// You can import this from a helper file
const canEditQuizContent = async (userId, userRole, quizId) => {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) return false;
    const course = await CourseModel.findById(quiz.course);
    if (!course) return false;
    return userRole === 'admin' || course.instructor.toString() === userId;
};


/**
 * @route   POST /api/quizzes/[quizId]/questions
 * @desc    Add a new question to a quiz
 * @access  Protected (Teacher, Admin)
 */
export async function POST(request, { params }) {
    await dbConnect();
    try {
        const { quizId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        if (!await canEditQuizContent(requesterId, requesterRole, quizId)) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to add questions to this quiz.' }, { status: 403 });
        }

        const body = await request.json();
        const { questionText, questionType, options } = body;

        const newQuestion = new QuestionModel({
            quiz: quizId,
            questionText,
            questionType,
            options,
        });

        await newQuestion.save();
        return NextResponse.json(newQuestion, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   GET /api/quizzes/[quizId]/questions
 * @desc    Get all questions for a specific quiz (for editing)
 * @access  Protected (Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const { quizId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        if (!await canEditQuizContent(requesterId, requesterRole, quizId)) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to view these questions.' }, { status: 403 });
        }

        // For teachers/admins, we return the full question object including correct answers
        const questions = await QuestionModel.find({ quiz: quizId });

        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}