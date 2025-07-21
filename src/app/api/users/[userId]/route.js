import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/utils/dbConnect';
import UserModel from '@/models/user.model';

// Helper to check authorization
function checkAuth(params) {
    const loggedInUserId = headers().get('x-user-id');
    const loggedInUserRole = headers().get('x-user-role');
    const targetUserId = params.userId;

    if (loggedInUserRole === 'admin' || loggedInUserId === targetUserId) {
        return { authorized: true };
    }
    return { authorized: false, message: 'Forbidden: You do not have permission to perform this action.' };
}

// Get a single user's details
export async function GET(request, { params }) {
    await dbConnect();
    try {
        const auth = checkAuth(params);
        if (!auth.authorized) {
            return NextResponse.json({ message: auth.message }, { status: 403 });
        }

        const user = await UserModel.findById(params.userId).select('-password');
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}

// Update a user's details
export async function PUT(request, { params }) {
    await dbConnect();
    try {
        const auth = checkAuth(params);
        if (!auth.authorized) {
            return NextResponse.json({ message: auth.message }, { status: 403 });
        }

        const body = await request.json();
        // Prevent password updates through this route
        delete body.password;

        const updatedUser = await UserModel.findByIdAndUpdate(params.userId, body, { new: true }).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}


// Delete a user (soft delete) - Admin only
export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const loggedInUserRole = headers().get('x-user-role');
        if (loggedInUserRole !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const user = await UserModel.findByIdAndUpdate(params.userId, { isActive: false }, { new: true });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'User deactivated successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
    }
}