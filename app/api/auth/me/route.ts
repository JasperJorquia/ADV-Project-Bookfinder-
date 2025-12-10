import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) return NextResponse.json({ success: false }, { status: 401 });

    const [rows]: any = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return NextResponse.json({ success: false }, { status: 404 });

    return NextResponse.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('me error', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
