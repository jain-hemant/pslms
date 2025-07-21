import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import EnrollmentModel from '@/models/enrollment.model';
import CourseModel from '@/models/course.model';

/**
 * @route   GET /api/enrollments/course/[courseId]/students
 * @desc    Get all students enrolled in a specific course
 * @access  Protected (Teacher of the course, Admin)
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

        // Authorization check
        if (requesterRole !== 'admin' && course.instructor.toString() !== requesterId) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to view this resource.' }, { status: 403 });
        }

        const enrollments = await EnrollmentModel.find({ course: courseId })
            .populate('student', 'fullName email profilePicture') // Select fields from the user model to return
            .sort({ enrollmentDate: 'asc' });

        return NextResponse.json(enrollments);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}