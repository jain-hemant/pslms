import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
import QuizAttemptModel from '@/models/quizAttempt.model';
import QuizModel from '@/models/quiz.model';
import CourseModel from '@/models/course.model';

/**
 * @route   GET /api/quiz-attempts/[attemptId]
 * @desc    Get the detailed results of a specific attempt
 * @access  Protected (Student who owns the attempt, Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const { attemptId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        const attempt = await QuizAttemptModel.findById(attemptId).populate({
            path: 'answers.question',
            model: 'question',
            select: 'questionText' // Add question text for context
        });

        if (!attempt) {
            return NextResponse.json({ message: 'Quiz attempt not found' }, { status: 404 });
        }

        // Authorization check
        const isOwner = attempt.student.toString() === requesterId;
        if (isOwner) {
            return NextResponse.json(attempt);
        }

        const quiz = await QuizModel.findById(attempt.quiz);
        const course = await CourseModel.findById(quiz.course);
        const isInstructorOrAdmin = requesterRole === 'admin' || course.instructor.toString() === requesterId;

        if (isInstructorOrAdmin) {
            return NextResponse.json(attempt);
        }

        return NextResponse.json({ message: 'Forbidden: You do not have permission to view this attempt.' }, { status: 403 });

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}