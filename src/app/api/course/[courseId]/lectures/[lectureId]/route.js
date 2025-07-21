import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import LectureModel from '@/models/lecture.model';
import CourseModel from '@/models/course.model';
import EnrollmentModel from '@/models/enrollment.model';

// Helper function to check if user can VIEW a lecture
const canViewLecture = async (userId, userRole, courseId) => {
    const course = await CourseModel.findById(courseId);
    if (!course) return false;

    if (userRole === 'admin' || course.instructor.toString() === userId) {
        return true;
    }

    const isEnrolled = await EnrollmentModel.findOne({ student: userId, course: courseId });
    return !!isEnrolled;
};

// Helper function to check if user can EDIT a lecture
const canEditLecture = async (userId, userRole, courseId) => {
    const course = await CourseModel.findById(courseId);
    if (!course) return false;

    return userRole === 'admin' || course.instructor.toString() === userId;
};


/**
 * @route   GET /api/courses/[courseId]/lectures/[lectureId]
 * @desc    Get details for a single lecture
 * @access  Protected (Enrolled Student, Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const { courseId, lectureId } = params;
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        if (!await canViewLecture(userId, userRole, courseId)) {
            return NextResponse.json({ message: 'Forbidden: You do not have access to this lecture.' }, { status: 403 });
        }

        const lecture = await LectureModel.findOne({ _id: lectureId, course: courseId });
        if (!lecture) {
            return NextResponse.json({ message: 'Lecture not found' }, { status: 404 });
        }

        return NextResponse.json(lecture);

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   PUT /api/courses/[courseId]/lectures/[lectureId]
 * @desc    Update a lecture's details
 * @access  Protected (Teacher of the course, Admin)
 */
export async function PUT(request, { params }) {
    await dbConnect();
    try {
        const { courseId, lectureId } = params;
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        if (!await canEditLecture(userId, userRole, courseId)) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to edit this lecture.' }, { status: 403 });
        }

        const body = await request.json();
        const updatedLecture = await LectureModel.findOneAndUpdate(
            { _id: lectureId, course: courseId },
            body,
            { new: true, runValidators: true }
        );

        if (!updatedLecture) {
            return NextResponse.json({ message: 'Lecture not found' }, { status: 404 });
        }

        return NextResponse.json(updatedLecture);

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   DELETE /api/courses/[courseId]/lectures/[lectureId]
 * @desc    Delete a lecture
 * @access  Protected (Teacher of the course, Admin)
 */
export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const { courseId, lectureId } = params;
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        if (!await canEditLecture(userId, userRole, courseId)) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to delete this lecture.' }, { status: 403 });
        }

        const deletedLecture = await LectureModel.findOneAndDelete({ _id: lectureId, course: courseId });

        if (!deletedLecture) {
            return NextResponse.json({ message: 'Lecture not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Lecture deleted successfully' });

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}