import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import QuizModel from '@/models/quiz.model';
import CourseModel from '@/models/course.model';

/**
 * @route   POST /api/quizzes
 * @desc    Create a new quiz
 * @access  Protected (Teacher, Admin)
 */
export async function POST(request) {
    await dbConnect();
    try {
        const requesterId = headers().get('x-user-id');
        const requesterRole = headers().get('x-user-role');
        const { title, courseId, lectureId, dueDate } = await request.json();

        if (!title || !courseId) {
            return NextResponse.json({ message: 'Title and Course ID are required.' }, { status: 400 });
        }

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Authorization check: Must be the course instructor or an admin
        if (requesterRole !== 'admin' && course.instructor.toString() !== requesterId) {
            return NextResponse.json({ message: 'Forbidden: You are not authorized to create quizzes for this course.' }, { status: 403 });
        }

        const newQuiz = new QuizModel({
            title,
            course: courseId,
            lecture: lectureId, // Optional: link quiz to a specific lecture
            dueDate,
        });

        await newQuiz.save();

        return NextResponse.json(newQuiz, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}