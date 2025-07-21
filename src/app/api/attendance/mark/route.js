import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import AttendanceModel from '@/models/attendance.model';
import EnrollmentModel from '@/models/enrollment.model';
import LectureModel from '@/models/lecture.model';

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark the current user as present for a lecture
 * @access  Protected (Student)
 */
export async function POST(request) {
    await dbConnect();
    try {
        const studentId = headers().get('x-user-id');
        const { lectureId } = await request.json();

        if (!lectureId) {
            return NextResponse.json({ message: 'Lecture ID is required' }, { status: 400 });
        }

        // Find the lecture to get its associated course
        const lecture = await LectureModel.findById(lectureId);
        if (!lecture) {
            return NextResponse.json({ message: 'Lecture not found' }, { status: 404 });
        }
        const courseId = lecture.course;

        // Verify the student is actually enrolled in the course
        const enrollment = await EnrollmentModel.findOne({ student: studentId, course: courseId });
        if (!enrollment) {
            return NextResponse.json({ message: 'Forbidden: You are not enrolled in this course.' }, { status: 403 });
        }

        // Check if attendance is already marked to prevent duplicates
        const existingAttendance = await AttendanceModel.findOne({ student: studentId, lecture: lectureId });
        if (existingAttendance) {
            return NextResponse.json({ message: 'Attendance already marked', data: existingAttendance }, { status: 200 });
        }

        const newAttendance = new AttendanceModel({
            student: studentId,
            lecture: lectureId,
            course: courseId, // Store course for easier querying
            status: 'present'
        });

        await newAttendance.save();
        return NextResponse.json(newAttendance, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}