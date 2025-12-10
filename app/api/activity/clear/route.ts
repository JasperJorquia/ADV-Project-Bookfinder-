import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute('DELETE FROM user_activity WHERE user_id = ?', [parseInt(userId)]);
      connection.release();
      return NextResponse.json({ success: true, message: 'Activity cleared' });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (err) {
    console.error('Clear activity error:', err);
    return NextResponse.json({ success: false, error: 'Failed to clear activity' }, { status: 500 });
  }
}
