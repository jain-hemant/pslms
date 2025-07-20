import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import LectureModel from '@/models/lecture.model';
import CourseModel from '@/models/course.model';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   POST /api/courses/[courseId]/lectures
 * @desc    Create a new lecture for a specific course
 * @access  Protected (Teacher of the course, Admin)
 */
export async function POST(request, { params }) {
    await dbConnect();
    try {
        const { courseId } = params;
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization: Must be the course instructor or an admin
        if (course.instructor.toString() !== userId && userRole !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to add lectures to this course.' }, { status: 403 });
        }

        const body = await request.json();
        const newLecture = new LectureModel({
            ...body,
            course: courseId // Ensure lecture is associated with the correct course
        });

        await newLecture.save();

        return NextResponse.json(newLecture, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   GET /api/courses/[courseId]/lectures
 * @desc    Get all lectures for a specific course
 * @access  Protected (Enrolled Student, Teacher, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const { courseId } = params;
        const userId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization: User must be enrolled, the instructor, or an admin
        const isEnrolled = await EnrollmentModel.findOne({ student: userId, course: courseId });

        if (course.instructor.toString() !== userId && userRole !== 'admin' && !isEnrolled) {
            return NextResponse.json({ message: 'Forbidden: You must be enrolled to view lectures.' }, { status: 403 });
        }

        const lectures = await LectureModel.find({ course: courseId }).sort({ order: 'asc' });
        return NextResponse.json(lectures);

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}