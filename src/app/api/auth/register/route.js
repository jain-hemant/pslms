import { NextResponse } from 'next/server';
import dbConnect from '@/lib/utility/dbConnect';
import UserModel from '@/models/user.model';
import { hashPassword } from '@/lib/utility/crypto';

export async function POST(request) {
    await dbConnect();
    try {
        const body = await request.json();
        const { fullName, email, password, phoneNumber } = body;

        if (!fullName || !email || !password || !phoneNumber) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new UserModel({
            ...body,
            password: hashedPassword,
        });

        await newUser.save();

        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}