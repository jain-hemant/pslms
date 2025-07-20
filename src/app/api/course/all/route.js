import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import CourseModel from '@/models/course.model';

/**
 * @route   GET /api/courses/all
 * @desc    Get a list of ALL courses (published and unpublished)
 * @access  Protected (Admin)
 */
export async function GET(request) {
    await dbConnect();
    try {
        const userRole = headers().get('x-user-role');

        // Authorization: Admin only
        if (userRole !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
        }

        const courses = await CourseModel.find({}) // No filter for published status
            .populate('instructor', 'fullName email role')
            .sort({ createdAt: -1 });

        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}