import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
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
 * @route   GET /api/quizzes/[quizId]/questions/[questionId]
 * @desc    Get a single question by its ID
 * @access  Protected (Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const { quizId, questionId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        if (!await canEditQuizContent(requesterId, requesterRole, quizId)) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const question = await QuestionModel.findOne({ _id: questionId, quiz: quizId });
        if (!question) {
            return NextResponse.json({ message: 'Question not found in this quiz' }, { status: 404 });
        }
        return NextResponse.json(question);
    } catch (error) {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

/**
 * @route   PUT /api/quizzes/[quizId]/questions/[questionId]
 * @desc    Update a question
 * @access  Protected (Teacher, Admin)
 */
export async function PUT(request, { params }) {
    await dbConnect();
    try {
        const { quizId, questionId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        if (!await canEditQuizContent(requesterId, requesterRole, quizId)) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const updatedQuestion = await QuestionModel.findOneAndUpdate(
            { _id: questionId, quiz: quizId },
            body,
            { new: true, runValidators: true }
        );
        if (!updatedQuestion) {
            return NextResponse.json({ message: 'Question not found' }, { status: 404 });
        }
        return NextResponse.json(updatedQuestion);
    } catch (error) {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

/**
 * @route   DELETE /api/quizzes/[quizId]/questions/[questionId]
 * @desc    Delete a question
 * @access  Protected (Teacher, Admin)
 */
export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const { quizId, questionId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        if (!await canEditQuizContent(requesterId, requesterRole, quizId)) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const deletedQuestion = await QuestionModel.findOneAndDelete({ _id: questionId, quiz: quizId });
        if (!deletedQuestion) {
            return NextResponse.json({ message: 'Question not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Question deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}