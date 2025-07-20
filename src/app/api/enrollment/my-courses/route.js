import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   GET /api/enrollments/my-courses
 * @desc    Get all courses the current user is enrolled in
 * @access  Protected (Student)
 */
export async function GET(request) {
    await dbConnect();
    try {
        const studentId = headers().get('x-user-id');

        if (!studentId) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        const myEnrollments = await EnrollmentModel.find({ student: studentId })
            .populate({
                path: 'course',
                model: 'course',
                // Only populate active courses
                match: { isActive: true },
                populate: {
                    path: 'instructor',
                    model: 'user',
                    select: 'fullName'
                }
            })
            .sort({ enrollmentDate: -1 });

        // Filter out null courses that didn't match the 'isActive' condition
        const activeEnrollments = myEnrollments.filter(enrollment => enrollment.course);

        return NextResponse.json(activeEnrollments);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}