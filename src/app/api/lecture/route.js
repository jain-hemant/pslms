import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
import LectureModel from '@/lib/models/lecture.model';
import CourseModel from '@/lib/models/course.model';
import EnrollmentModel from '@/lib/models/enrollment.model';

/**
 * @route   POST /api/lecture
 * @desc    Create a new lecture for a course
 * @access  Protected (Instructor of course, Admin)
 */
export async function POST(request) {
    await dbConnect();
    try {
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');
        const body = await request.json();
        const { courseId } = body;

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization: Must be the course instructor or an admin
        if (course.instructor.toString() !== userId && userRole !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to add lectures to this course.' }, { status: 403 });
        }

        const newLecture = new LectureModel({ ...body, course: courseId });
        await newLecture.save();

        return NextResponse.json(newLecture, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   GET /api/lecture?courseId={id}
 * @desc    Get all lectures for a specific course
 * @access  Protected (Enrolled Student, Instructor, Admin)
 */
export async function GET(request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        if (!courseId) {
            return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
        }

        // Authorization: User must be enrolled, the instructor, or an admin
        const course = await CourseModel.findById(courseId);
        const isEnrolled = await EnrollmentModel.findOne({ student: userId, course: courseId });

        if (course.instructor.toString() !== userId && userRole !== 'admin' && !isEnrolled) {
            return NextResponse.json({ message: 'Forbidden: You must be enrolled to view lectures.' }, { status: 403 });
        }

        const lectures = await LectureModel.find({ course: courseId }).sort({ order: 1 });
        return NextResponse.json(lectures);

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}