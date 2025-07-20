import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import CourseModel from '@/models/course.model';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   GET /api/courses/[courseId]
 * @desc    Get details for a single course
 * @access  Authenticated User (if enrolled), Teacher, Admin
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const course = await CourseModel.findById(params.courseId)
            .populate('instructor', 'fullName email profilePicture bio');

        if (!course || !course.isActive) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // If course is published, it's public
        if (course.isPublished) {
            return NextResponse.json(course);
        }

        // If not published, it's private. Check for access.
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        if (!userId) {
            return NextResponse.json({ message: 'Forbidden: You must be logged in to view this course' }, { status: 403 });
        }

        const isEnrolled = await EnrollmentModel.findOne({ student: userId, course: params.courseId });

        if (course.instructor._id.toString() === userId || userRole === 'admin' || isEnrolled) {
            return NextResponse.json(course);
        }

        return NextResponse.json({ message: 'Forbidden: You do not have access to this course' }, { status: 403 });

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   PUT /api/courses/[courseId]
 * @desc    Update a course's details
 * @access  Protected (Instructor of course, Admin)
 */
export async function PUT(request, { params }) {
    await dbConnect();
    try {
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        const courseToUpdate = await CourseModel.findById(params.courseId);
        if (!courseToUpdate) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization: Must be the course instructor or an admin
        if (courseToUpdate.instructor.toString() !== userId && userRole !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to update this course.' }, { status: 403 });
        }

        const body = await request.json();
        const updatedCourse = await CourseModel.findByIdAndUpdate(params.courseId, body, { new: true, runValidators: true });

        return NextResponse.json(updatedCourse);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   DELETE /api/courses/[courseId]
 * @desc    Delete a course (soft delete)
 * @access  Protected (Instructor of course, Admin)
 */
export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        const courseToDelete = await CourseModel.findById(params.courseId);
        if (!courseToDelete) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization check
        if (courseToDelete.instructor.toString() !== userId && userRole !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to delete this course.' }, { status: 403 });
        }

        // Soft delete by setting isActive to false
        await CourseModel.findByIdAndUpdate(params.courseId, { isActive: false });

        return NextResponse.json({ message: 'Course deactivated successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}