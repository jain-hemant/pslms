import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utility/token';

export function middleware(request) {
    const path = request.nextUrl.pathname;

    // Define protected routes
    const protectedPaths = ['/api/users', '/api/auth/me'];
    const isAdminPath = path.startsWith('/api/users') && path !== '/api/users/me';

    const token = request.headers.get('authorization')?.split(' ')[1];

    if (protectedPaths.some(p => path.startsWith(p))) {
        if (!token) {
            return NextResponse.json({ message: 'Authentication required: No token provided' }, { status: 401 });
        }

        const decoded = verifyToken(token, true); // Verify access token

        if (!decoded) {
            return NextResponse.json({ message: 'Authentication failed: Invalid token' }, { status: 401 });
        }

        // Add decoded user info to the request headers to be accessed in the route handler
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', decoded.id);
        requestHeaders.set('x-user-role', decoded.role);

        // Role check for admin-only routes
        if (isAdminPath && decoded.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
    matcher: ['/api/auth/me', '/api/users/:path*'],
};