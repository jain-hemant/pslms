import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utility/dbConnect';
import UserModel from '@/models/user.model';

export async function GET(request) {
    await dbConnect();
    try {
        // The user ID is added to the headers by the middleware
        const userId = headers().get('x-user-id');

        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}