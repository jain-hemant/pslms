import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import QuizModel from '@/models/quiz.model';
import CourseModel from '@/models/course.model';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   GET /api/quizzes/course/[courseId]
 * @desc    Get all quizzes for a specific course
 * @access  Protected (Enrolled Student, Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const { courseId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization check: User must be enrolled, the instructor, or an admin
        const isEnrolled = await EnrollmentModel.findOne({ student: requesterId, course: courseId });

        if (requesterRole !== 'admin' && course.instructor.toString() !== requesterId && !isEnrolled) {
            return NextResponse.json({ message: 'Forbidden: You must be enrolled to view quizzes for this course.' }, { status: 403 });
        }

        const quizzes = await QuizModel.find({ course: courseId }).sort({ createdAt: 'asc' });

        return NextResponse.json(quizzes);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}