import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import CourseModel from '@/models/course.model';

/**
 * @route   GET /api/courses/instructor/[userId]
 * @desc    Get all courses taught by a specific instructor
 * @access  Public (shows only published), Protected (shows all if self)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const instructorId = params.userId;
        const requesterId = headers().get('x-user-id');

        const query = {
            instructor: instructorId,
            isActive: true,
        };

        // If the person requesting the list is NOT the instructor themselves,
        // then only show the publicly published courses.
        if (requesterId !== instructorId) {
            query.isPublished = true;
        }

        const courses = await CourseModel.find(query)
            .populate('instructor', 'fullName')
            .sort({ createdAt: -1 });

        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}