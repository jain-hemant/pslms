import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
import QuizAttemptModel from '@/models/quizAttempt.model';

/**
 * @route   GET /api/quiz-attempts/quiz/[quizId]/my-results
 * @desc    Get the current user's past attempts for a specific quiz
 * @access  Protected (Student)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const studentId = headers().get('x-user-id');
        const { quizId } = params;

        const attempts = await QuizAttemptModel.find({ student: studentId, quiz: quizId })
            .sort({ startTime: -1 })
            .select('score startTime'); // Only send essential data for a list view

        return NextResponse.json(attempts);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}