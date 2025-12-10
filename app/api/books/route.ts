import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [books] = await pool.query(
      'SELECT * FROM user_books WHERE user_id = ? ORDER BY added_date DESC',
      [userId]
    );

    return NextResponse.json({ success: true, data: books });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// POST - Create new book entry
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { book_id, title, author, cover_image, status } = await request.json();

    if (!book_id || !title) {
      return NextResponse.json(
        { success: false, error: 'Book ID and title are required' },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      'INSERT INTO user_books (user_id, book_id, title, author, cover_image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, book_id, title, author || '', cover_image || '', status || 'wishlist']
    );

    return NextResponse.json({
      success: true,
      message: 'Book added successfully',
      bookId: result.insertId,
    });
  } catch (error: any) {
    console.error('Error adding book:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'Book already in your list' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to add book' },
      { status: 500 }
    );
  }
}

// PUT - Update book
export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, status, progress, title, author, cover_image } = await request.json();

  
    await pool.query(
      'UPDATE user_books SET status = IFNULL(?,status), progress = IFNULL(?,progress), title = IFNULL(?,title), author = IFNULL(?,author), cover_image = IFNULL(?,cover_image) WHERE id = ? AND user_id = ?',
      [status ?? null, progress ?? null, title ?? null, author ?? null, cover_image ?? null, id, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('id');

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    await pool.query(
      'DELETE FROM user_books WHERE id = ? AND user_id = ?',
      [bookId, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Book removed successfully',
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}