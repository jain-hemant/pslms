import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import EnrollmentModel from '@/models/enrollment.model';
import LectureModel from '@/models/lecture.model';

/**
 * @route   POST /api/enrollments/progress
 * @desc    Update the current user's progress for a lecture
 * @access  Protected (Student)
 */
export async function POST(request) {
    await dbConnect();
    try {
        const studentId = headers().get('x-user-id');
        const { lectureId, courseId } = await request.json();

        if (!lectureId || !courseId) {
            return NextResponse.json({ message: 'Lecture ID and Course ID are required.' }, { status: 400 });
        }

        const enrollment = await EnrollmentModel.findOne({ student: studentId, course: courseId });
        if (!enrollment) {
            return NextResponse.json({ message: 'Enrollment not found. You must be enrolled to update progress.' }, { status: 404 });
        }

        // Add lecture to progress map if it doesn't exist
        if (!enrollment.progress.has(lectureId)) {
            enrollment.progress.set(lectureId, true);
        }

        // Optional: Recalculate overall course completion status
        const totalLectures = await LectureModel.countDocuments({ course: courseId });
        const completedLectures = enrollment.progress.size;

        if (completedLectures >= totalLectures) {
            enrollment.completionStatus = 'completed';
        } else {
            enrollment.completionStatus = 'in_progress';
        }

        await enrollment.save();

        return NextResponse.json(enrollment);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}