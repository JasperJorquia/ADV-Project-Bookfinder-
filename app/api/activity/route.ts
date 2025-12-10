import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ success: true, data: [] });

    const [rows]: any = await pool.query('SELECT id, message, created_at FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    console.error('Activity GET error', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value || null;
    const { message } = await request.json();
    if (!message) return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 });

    await pool.query('INSERT INTO user_activity (user_id, message) VALUES (?, ?)', [userId, message]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Activity POST error', err);
    return NextResponse.json({ success: false, error: 'Failed to add activity' }, { status: 500 });
  }
}
