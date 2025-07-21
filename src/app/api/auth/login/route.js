import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
import UserModel from '@/models/user.model';
import { comparePassword } from '@/lib/utility/crypto';
import { generateTokens } from '@/lib/utility/token';

export async function POST(request) {
    await dbConnect();
    try {

        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }

        const user = await UserModel.findOne({ email, isActive: true }).select('+password');
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const isPasswordMatch = await comparePassword(password, user.password);
        if (!isPasswordMatch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Set access token in a secure, httpOnly cookie
        cookies().set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Set refresh token in a secure, httpOnly cookie
        cookies().set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Omit password from the returned user object
        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json({
            message: 'Logged in successfully',
            accessToken,
            user: userResponse,
        });
    } catch (error) {
        console.log('Login error:', error);
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}