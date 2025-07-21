import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

// Generates both access and refresh tokens
export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' } // Long-lived refresh token
    );

    return { accessToken, refreshToken };
};

// Verifies a token
export const verifyToken = (token, isAccessToken = true) => {
    try {
        const secret = isAccessToken ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
};