import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import QuizModel from '@/lib/models/quiz.model';
import QuestionModel from '@/lib/models/question.model';
import EnrollmentModel from '@/lib/models/enrollment.model';
import CourseModel from '@/lib/models/course.model';

// Helper function for authorization checks
const checkAccess = async (requesterId, requesterRole, quiz) => {
    const course = await CourseModel.findById(quiz.course);
    if (!course) return { canView: false, canEdit: false };

    const isInstructor = course.instructor.toString() === requesterId;
    const isAdmin = requesterRole === 'admin';

    // Edit access is for instructors and admins only
    const canEdit = isInstructor || isAdmin;

    // View access is for editors or enrolled students
    const isEnrolled = await EnrollmentModel.findOne({ student: requesterId, course: quiz.course });
    const canView = canEdit || !!isEnrolled;

    return { canView, canEdit };
};

/**
 * @route   GET /api/quizzes/[quizId]
 * @desc    Get a single quiz with its questions
 * @access  Protected (Enrolled Student, Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const quiz = await QuizModel.findById(params.quizId);
        if (!quiz) {
            return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
        }

        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        const { canView } = await checkAccess(requesterId, requesterRole, quiz);
        if (!canView) {
            return NextResponse.json({ message: 'Forbidden: You do not have access to this quiz.' }, { status: 403 });
        }

        // Fetch all questions related to this quiz
        const questions = await QuestionModel.find({ quiz: params.quizId }).select('-options.isCorrect'); // Hide correct answers from students by default

        // Convert quiz to a plain object to attach questions
        const quizResponse = quiz.toObject();
        quizResponse.questions = questions;

        return NextResponse.json(quizResponse);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   PUT /api/quizzes/[quizId]
 * @desc    Update a quiz's details
 * @access  Protected (Teacher, Admin)
 */
export async function PUT(request, { params }) {
    await dbConnect();
    try {
        const quiz = await QuizModel.findById(params.quizId);
        if (!quiz) {
            return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
        }

        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        const { canEdit } = await checkAccess(requesterId, requesterRole, quiz);
        if (!canEdit) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to edit this quiz.' }, { status: 403 });
        }

        const body = await request.json();
        const updatedQuiz = await QuizModel.findByIdAndUpdate(params.quizId, body, { new: true });

        return NextResponse.json(updatedQuiz);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   DELETE /api/quizzes/[quizId]
 * @desc    Delete a quiz and its associated questions
 * @access  Protected (Teacher, Admin)
 */
export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const quiz = await QuizModel.findById(params.quizId);
        if (!quiz) {
            return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
        }

        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        const { canEdit } = await checkAccess(requesterId, requesterRole, quiz);
        if (!canEdit) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to delete this quiz.' }, { status: 403 });
        }

        // Transaction: Delete the quiz and all its questions together
        await QuestionModel.deleteMany({ quiz: params.quizId });
        await QuizModel.findByIdAndDelete(params.quizId);

        return NextResponse.json({ message: 'Quiz and all associated questions deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}