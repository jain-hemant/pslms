import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import EnrollmentModel from '@/models/enrollment.model';
import CourseModel from '@/models/course.model';

/**
 * @route   POST /api/enrollments
 * @desc    Enroll the current user in a course
 * @access  Protected (Student role is implicit by being a logged-in user)
 */
export async function POST(request) {
    await dbConnect();
    try {
        const studentId = headers().get('x-user-id');
        const { courseId } = await request.json();

        if (!courseId) {
            return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
        }

        // Check if the course exists and is available for enrollment
        const course = await CourseModel.findOne({ _id: courseId, isPublished: true, isActive: true });
        if (!course) {
            return NextResponse.json({ message: 'Course not found or not available for enrollment' }, { status: 404 });
        }

        // Prevent instructor from enrolling in their own course
        if (course.instructor.toString() === studentId) {
            return NextResponse.json({ message: 'Instructors cannot enroll in their own courses' }, { status: 403 });
        }

        // Check if user is already enrolled
        const existingEnrollment = await EnrollmentModel.findOne({ student: studentId, course: courseId });
        if (existingEnrollment) {
            return NextResponse.json({ message: 'You are already enrolled in this course' }, { status: 409 });
        }

        const newEnrollment = new EnrollmentModel({
            student: studentId,
            course: courseId,
        });

        await newEnrollment.save();
        return NextResponse.json(newEnrollment, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}