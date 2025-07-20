import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
import AttendanceModel from '@/models/attendance.model';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   POST /api/attendance
 * @desc    Mark attendance for a lecture
 * @access  Protected (Student)
 */
export async function POST(request) {
    await dbConnect();
    try {
        const studentId = headers().get('x-user-id');
        const { lectureId, courseId } = await request.json();

        // Verify user is enrolled in the course
        const isEnrolled = await EnrollmentModel.findOne({ student: studentId, course: courseId });
        if (!isEnrolled) {
            return NextResponse.json({ message: 'Forbidden: You are not enrolled in this course.' }, { status: 403 });
        }

        // Check if attendance is already marked
        const existingAttendance = await AttendanceModel.findOne({ student: studentId, lecture: lectureId });
        if (existingAttendance) {
            return NextResponse.json(existingAttendance, { status: 200 }); // Already marked, just return success
        }

        const newAttendance = new AttendanceModel({
            student: studentId,
            lecture: lectureId,
            course: courseId,
            status: 'present'
        });

        await newAttendance.save();
        return NextResponse.json(newAttendance, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}