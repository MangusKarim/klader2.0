import jwt from 'jsonwebtoken';
import { getDbData } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'klader_premium_luxury_secret_key_2026';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );

    const token = cookies['klader_session'];
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || !decoded.username) return null;

    const data = await getDbData();
    const user = data.users.find(u => u.username === decoded.username && u.status === 'active');
    
    if (!user) return null;
    
    // Remove password hash from user object before returning
    const { password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
