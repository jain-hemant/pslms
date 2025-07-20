import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    // Clear the refresh token cookie
    cookies().set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        path: '/',
    });

    return NextResponse.json({ message: 'Logged out successfully' });
}