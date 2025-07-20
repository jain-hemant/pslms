import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import AttendanceModel from '@/models/attendance.model';
import CourseModel from '@/models/course.model';
import LectureModel from '@/models/lecture.model';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   GET /api/attendance/course/[courseId]/report
 * @desc    Get the attendance report for a specific course
 * @access  Protected (Teacher of the course, Admin)
 */
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const { courseId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization check
        if (requesterRole !== 'admin' && course.instructor.toString() !== requesterId) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to view this report.' }, { status: 403 });
        }

        // For a more useful report, let's aggregate the data.
        // We will get a list of all enrolled students and for each, a list of lectures they attended.

        const enrolledStudents = await EnrollmentModel.find({ course: courseId }).populate('student', 'fullName email');
        const lecturesInCourse = await LectureModel.find({ course: courseId }).sort({ order: 'asc' });
        const allAttendance = await AttendanceModel.find({ course: courseId });

        const report = enrolledStudents.map(enrollment => {
            const studentAttendance = allAttendance.filter(
                att => att.student.toString() === enrollment.student._id.toString()
            );
            return {
                student: enrollment.student,
                attendedLectures: studentAttendance.map(att => att.lecture),
                attendanceCount: studentAttendance.length,
                totalLectures: lecturesInCourse.length,
            };
        });

        return NextResponse.json({
            courseTitle: course.title,
            lectures: lecturesInCourse,
            report: report
        });

    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}