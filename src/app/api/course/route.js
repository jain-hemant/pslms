import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import CourseModel from '@/models/course.model';

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Protected (Teacher, Admin)
 */
export async function POST(request) {
    await dbConnect();
    try {
        const instructorId = headers().get('x-user-id');
        const userRole = headers().get('x-user-role');

        // Authorization: Only teachers and admins can create courses
        if (userRole !== 'teacher' && userRole !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: You do not have permission to create a course.' }, { status: 403 });
        }

        const body = await request.json();

        const newCourse = new CourseModel({
            ...body,
            instructor: instructorId,
        });

        await newCourse.save();

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

/**
 * @route   GET /api/courses
 * @desc    Get a list of all PUBLISHED courses
 * @access  Public
 */
export async function GET(request) {
    await dbConnect();
    try {
        const courses = await CourseModel.find({ isPublished: true, isActive: true })
            .populate('instructor', 'fullName email') // Populate instructor's name and email
            .sort({ createdAt: -1 });

        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}