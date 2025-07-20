import { NextResponse } from 'next/server';
import dbConnect from '@/lib/utils/dbConnect';
import UserModel from '@/models/user.model';

// Get all users (Admin only)
export async function GET() {
    await dbConnect();
    try {
        const users = await UserModel.find({}).select('-password');
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}