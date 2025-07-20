// lib/utils/authHelpers.js (or similar)
import QuizModel from '@/models/quiz.model';
import CourseModel from '@/models/course.model';

export const canEditQuizContent = async (userId, userRole, quizId) => {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) return false;

    const course = await CourseModel.findById(quiz.course);
    if (!course) return false;

    // Check if the user is the instructor of the course or an admin
    const isInstructor = course.instructor.toString() === userId;
    const isAdmin = userRole === 'admin';

    return isInstructor || isAdmin;
};