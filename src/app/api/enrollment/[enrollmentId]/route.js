import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   DELETE /api/enrollments/[enrollmentId]
 * @desc    Unenroll a student from a course
 * @access  Protected (Student who owns enrollment, Admin)
 */
export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const { enrollmentId } = params;
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');

        const enrollment = await EnrollmentModel.findById(enrollmentId);
        if (!enrollment) {
            return NextResponse.json({ message: 'Enrollment not found' }, { status: 404 });
        }

        // Authorization check
        if (requesterRole !== 'admin' && enrollment.student.toString() !== requesterId) {
            return NextResponse.json({ message: 'Forbidden: You can only unenroll yourself.' }, { status: 403 });
        }

        await EnrollmentModel.findByIdAndDelete(enrollmentId);

        return NextResponse.json({ message: 'Successfully unenrolled from the course' });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}