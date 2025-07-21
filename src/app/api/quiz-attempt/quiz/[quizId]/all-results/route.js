import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
import QuizAttemptModel from '@/models/quizAttempt.model';
import QuizModel from '@/models/quiz.model';
import CourseModel from '@/models/course.model';

/**
 * @route   GET /api/quiz-attempts/quiz/[quizId]/all-results
 * @desc    Get all attempts for a quiz by all students
 * @access  Protected (Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');
        const { quizId } = params;

        const quiz = await QuizModel.findById(quizId);
        if (!quiz) {
            return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
        }

        const course = await CourseModel.findById(quiz.course);
        // Authorization check
        if (requesterRole !== 'admin' && course.instructor.toString() !== requesterId) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to view these results.' }, { status: 403 });
        }

        const allAttempts = await QuizAttemptModel.find({ quiz: quizId })
            .populate('student', 'fullName email') // Populate student info for the report
            .sort({ score: -1 });

        return NextResponse.json(allAttempts);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}