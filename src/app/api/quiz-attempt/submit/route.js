import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '@/lib/utility/dbConnect';
import QuizAttemptModel from '@/models/quizAttempt.model';
import QuizModel from '@/models/quiz.model';
import QuestionModel from '@/models/question.model';
import EnrollmentModel from '@/models/enrollment.model';

/**
 * @route   POST /api/quiz-attempts/submit
 * @desc    Submit answers for a quiz attempt, grade it, and save the result
 * @access  Protected (Student)
 */
export async function POST(request) {
    await dbConnect();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const studentId = headers().get('x-user-id');
        const { quizId, answers: studentAnswers } = await request.json();

        if (!quizId || !studentAnswers || !Array.isArray(studentAnswers)) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Quiz ID and a valid answers array are required.' }, { status: 400 });
        }

        const quiz = await QuizModel.findById(quizId).session(session);
        if (!quiz) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
        }

        // Authorization: Check if the student is enrolled in the course
        const isEnrolled = await EnrollmentModel.findOne({ student: studentId, course: quiz.course }).session(session);
        if (!isEnrolled) {
            await session.abortTransaction();
            return NextResponse.json({ message: 'Forbidden: You are not enrolled in this course.' }, { status: 403 });
        }

        // --- SCORING LOGIC ---
        // Fetch all correct answers for this quiz from the database at once.
        const questions = await QuestionModel.find({ quiz: quizId }).session(session);
        const correctAnswersMap = new Map();
        questions.forEach(q => {
            const correctOption = q.options.find(opt => opt.isCorrect);
            if (correctOption) {
                correctAnswersMap.set(q._id.toString(), correctOption.text);
            }
        });

        let score = 0;
        const processedAnswers = [];

        // Grade each answer submitted by the student
        for (const studentAnswer of studentAnswers) {
            const isCorrect = correctAnswersMap.get(studentAnswer.questionId) === studentAnswer.selectedOption;
            if (isCorrect) {
                score++;
            }
            processedAnswers.push({
                question: studentAnswer.questionId,
                selectedOption: studentAnswer.selectedOption,
                isCorrect: isCorrect,
            });
        }

        const finalScore = questions.length > 0 ? (score / questions.length) * 100 : 0;

        const newAttempt = new QuizAttemptModel({
            student: studentId,
            quiz: quizId,
            answers: processedAnswers,
            score: finalScore,
        });

        await newAttempt.save({ session });

        await session.commitTransaction();

        return NextResponse.json(newAttempt, { status: 201 });
    } catch (error) {
        await session.abortTransaction();
        return NextResponse.json({ message: 'Server error during quiz submission', error: error.message }, { status: 500 });
    } finally {
        session.endSession();
    }
}