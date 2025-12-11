'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';

interface Book {
  id?: number;
  book_id: string;
  title: string;
  author: string;
  cover_image?: string;
  genre?: string;
  status: 'wishlist' | 'reading' | 'completed';
  progress?: number;
}

interface SearchBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  ratings_average?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchBook[]>([]);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'reading' | 'completed'>('reading');

  // Additional UI state
  const [trendingBooks, setTrendingBooks] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showListsModal, setShowListsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [trendingIndex, setTrendingIndex] = useState(0);

  const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Science Fiction', 'Fantasy', 'Romance', 'Biography', 'History', 'Self-Help', 'Business'];

  useEffect(() => {
    fetchUserBooks();
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    randomizeTrending();
    fetchRecentActivity();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) setUser(data.user);
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  const randomizeTrending = async () => {
    const keywords = ['fiction', 'history', 'mystery', 'fantasy', 'science'];
    const kw = keywords[Math.floor(Math.random() * keywords.length)];
    try {
      const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(kw)}&limit=6`);
      const d = await r.json();
      setTrendingBooks(d.docs || []);
    } catch (err) {
      console.error('Trending fetch failed', err);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      if (data.success) setRecentActivity(data.data || []);
    } catch (err) {
      console.error('Failed to fetch activity', err);
    }
  };

  const clearActivity = async () => {
    if (!confirm('Clear all activity?')) return;
    try {
      await fetch('/api/activity/clear', { method: 'POST' });
      setRecentActivity([]);
    } catch (err) {
      console.error('Error clearing activity', err);
    }
  };

  const getActivityIcon = (message: string) => {
    if (message.includes('Added')) return '💛'; // Yellow heart for wishlist
    if (message.includes('Started')) return '📗'; // Green book for reading
    if (message.includes('Completed')) return '✅'; // Checkmark for completed
    if (message.includes('Removed')) return '🗑'; // Trash for removed
    if (message.includes('Created')) return '➕'; // Plus for created
    return '⟳';
  };

  const fetchUserBooks = async () => {
    try {
      const response = await fetch('/api/books');
      const data = await response.json();
      if (data.success) {
        setUserBooks(data.data);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();
      setSearchResults(data.docs || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (book: SearchBook) => {
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: book.key,
          title: book.title,
          author: book.author_name?.[0] || 'Unknown Author',
          cover_image: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : '',
          status: 'wishlist',
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchUserBooks();
        // record activity
        try { await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Added ${book.title} to wishlist` }) }); } catch (e) { console.error(e); }
        fetchRecentActivity();
        alert('Book added to wishlist!');
      } else {
        alert(data.error || 'Failed to add book');
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book');
    }
  };

  const updateBookStatus = async (bookId: number, status: string, progress: number = 0, logActivity: boolean = true) => {
    try {
      await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookId, status, progress }),
      });
      fetchUserBooks();
      // Only log status changes, not progress slider updates
      if (logActivity) {
        if (status === 'reading') {
          try { await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Started reading` }) }); } catch (e) { console.error(e); }
        } else if (status === 'completed') {
          try { await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Completed reading` }) }); } catch (e) { console.error(e); }
        }
        fetchRecentActivity();
      }
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const deleteBook = async (bookId: number) => {
    if (!confirm('Remove this book from your list?')) return;

    try {
      await fetch(`/api/books?id=${bookId}`, {
        method: 'DELETE',
      });
      fetchUserBooks();
      try { await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Removed a book` }) }); } catch (e) { console.error(e); }
      fetchRecentActivity();
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createCustomBook = async (title: string, author: string, cover = '', status: string = 'wishlist') => {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: title.toLowerCase().replace(/\s+/g, '-'), title, author, cover_image: cover, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUserBooks();
        try { await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Created book ${title}` }) }); } catch (e) { console.error(e); }
        fetchRecentActivity();
        alert('Book created');
      } else alert(data.error || 'Failed to create');
    } catch (err) {
      console.error(err);
      alert('Error creating book');
    }
  };

  const wishlistBooks = selectedGenres.length > 0 ? userBooks.filter(b => b.status === 'wishlist' && selectedGenres.includes(b.genre || '')) : userBooks.filter(b => b.status === 'wishlist');
  const readingBooks = selectedGenres.length > 0 ? userBooks.filter(b => b.status === 'reading' && selectedGenres.includes(b.genre || '')) : userBooks.filter(b => b.status === 'reading');
  const completedBooks = selectedGenres.length > 0 ? userBooks.filter(b => b.status === 'completed' && selectedGenres.includes(b.genre || '')) : userBooks.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10 text-teal-600" />
              <span className="text-2xl font-bold text-gray-900">BookFinder</span>
            </div>

            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search books, authors, ISBN..."
                  className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md transition-shadow"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:bg-gray-100 hover:shadow-md rounded-lg px-3 py-2 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-40">
                  <button onClick={() => { setShowProfileModal(true); setShowDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-900 font-medium">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <button onClick={() => { setShowListsModal(true); setShowDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-900 font-medium">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    My Lists
                  </button>
                  <button onClick={() => { setShowSettingsModal(true); setShowDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-900 font-medium">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={() => { handleLogout(); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {searchResults.length === 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                  Trending Now
                </h2>
                <div className="flex gap-2 items-center">
                  <button onClick={randomizeTrending} className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">Refresh</button>
                  <button onClick={async () => { const t = prompt('Book title'); if (!t) return; const a = prompt('Author name (optional)') || 'Unknown'; await createCustomBook(t, a); }} className="px-3 py-2 bg-white rounded-lg text-teal-600 font-medium hover:bg-gray-100">Add Book</button>
                  <div className="ml-2 flex gap-1">
                    <button onClick={() => setTrendingIndex(Math.max(0, trendingIndex - 1))} disabled={trendingIndex === 0} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 disabled:opacity-50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button onClick={() => setTrendingIndex(Math.min(Math.max(0, trendingBooks.length - 3), trendingIndex + 1))} disabled={trendingIndex >= trendingBooks.length - 1} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 disabled:opacity-50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden">
                <div className="flex gap-6 transition-transform duration-300 ease-out" style={{ transform: `translateX(-${trendingIndex * (100/3)}%)` }}>
                {(trendingBooks && trendingBooks.length > 0 ? trendingBooks : [
                  { title: 'The Midnight Library', author: 'Matt Haig', img: 'https://covers.openlibrary.org/b/id/10677698-M.jpg' },
                  { title: 'Atomic Habits', author: 'James Clear', img: 'https://covers.openlibrary.org/b/id/8739161-M.jpg' },
                  { title: 'Project Hail Mary', author: 'Andy Weir', img: 'https://covers.openlibrary.org/b/id/11134430-M.jpg' },
                ]).map((book: any, idx: number) => (
                  <div key={idx} className="flex-shrink-0 w-full md:w-1/3 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex gap-4">
                      <img src={book.img || (book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 'https://via.placeholder.com/100x150?text=No+Cover')} alt={book.title} className="w-20 h-28 object-cover rounded-lg shadow-lg hover:shadow-2xl transition-shadow" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-white/80 text-sm truncate">{book.author || book.author_name?.[0]}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <button onClick={() => addToWishlist(book)} className="text-sm bg-white/30 hover:bg-white/50 hover:shadow-md active:scale-95 px-3 py-1 rounded text-white transition-all duration-200 font-medium">Add</button>
                          <button onClick={() => { setEditingBook({ book_id: book.key || '', title: book.title, author: book.author_name?.[0] || book.author || '', status: 'wishlist' }); setShowAddModal(true); }} className="text-sm bg-white/30 hover:bg-white/50 hover:shadow-md active:scale-95 px-3 py-1 rounded text-white transition-all duration-200 font-medium">Create</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {searchResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
                  <button
                    onClick={() => setSearchResults([])}
                    className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Clear
                  </button>
                </div>
                <p className="text-gray-600 mb-6">Found {searchResults.length} books</p>

                <div className="space-y-4">
                  {searchResults.map((book) => {
                    const isInList = userBooks.some(b => b.book_id === book.key);
                    return (
                      <div key={book.key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          <img
                            src={book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 'https://via.placeholder.com/100x150?text=No+Cover'}
                            alt={book.title}
                            className="w-24 h-36 object-cover rounded-lg shadow"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">{book.title}</h3>
                            <p className="text-gray-600 mb-2">{book.author_name?.[0] || 'Unknown Author'}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                              {book.ratings_average && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {book.ratings_average.toFixed(1)}
                                </span>
                              )}
                              {book.first_publish_year && <span>• {book.first_publish_year}</span>}
                            </div>
                            <button
                              onClick={() => addToWishlist(book)}
                              disabled={isInList}
                              className={`${
                                isInList
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg active:scale-95'
                              } px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2`}
                            >
                              {isInList ? (
                                <>
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  In Wishlist
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add to Wishlist
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {searchResults.length === 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  My Books
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('reading')}
                      className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 ${
                        activeTab === 'reading'
                          ? 'text-teal-600 border-b-2 border-teal-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                      </svg>
                      Reading ({readingBooks.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('completed')}
                      className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 ${
                        activeTab === 'completed'
                          ? 'text-teal-600 border-b-2 border-teal-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Completed ({completedBooks.length})
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                      {genres.map((g) => (
                        <button key={g} onClick={() => setSelectedGenres(selectedGenres.includes(g) ? selectedGenres.filter(x => x !== g) : [...selectedGenres, g])} className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${selectedGenres.includes(g) ? 'bg-teal-600 text-white shadow-md scale-105' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md active:scale-95'}`}>{g}</button>
                      ))}
                    </div>
                    {activeTab === 'reading' && (
                      <div className="space-y-4">
                        {readingBooks.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No books {selectedGenres.length > 0 ? 'in selected genres' : 'currently reading'}</p>
                        ) : (
                          readingBooks.map((book) => (
                            <div key={book.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                              <img
                                src={book.cover_image || 'https://via.placeholder.com/100x150?text=No+Cover'}
                                alt={book.title}
                                className="w-16 h-24 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{book.title}</h4>
                                <p className="text-sm text-gray-600">{book.author}</p>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{book.progress || 0}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-teal-600 h-2 rounded-full transition-all"
                                      style={{ width: `${book.progress || 0}%` }}
                                    ></div>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={book.progress || 0}
                                    onChange={(e) => updateBookStatus(book.id!, 'reading', parseInt(e.target.value), false)}
                                    className="w-40 mt-2 accent-teal-600 cursor-pointer"
                                  />
                                </div>
                                <div className="mt-4 flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => updateBookStatus(book.id!, 'completed', 100, true)}
                                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg active:scale-95 transition-all duration-200 uppercase tracking-wide"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' read online')}`, '_blank')}
                                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-95 transition-all duration-200 uppercase tracking-wide"
                                  >
                                    Read
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const newTitle = prompt('New title', book.title) || book.title;
                                      const newAuthor = prompt('New author', book.author) || book.author;
                                      try {
                                        await fetch('/api/books', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: book.id, title: newTitle, author: newAuthor }) });
                                        fetchUserBooks();
                                        fetchRecentActivity();
                                      } catch (e) { console.error(e); }
                                    }}
                                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 hover:shadow-lg active:scale-95 transition-all duration-200 uppercase tracking-wide"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteBook(book.id!)}
                                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 hover:shadow-lg active:scale-95 transition-all duration-200 uppercase tracking-wide"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'completed' && (
                      <div className="grid grid-cols-1 gap-4">
                        {completedBooks.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No completed books {selectedGenres.length > 0 ? 'in selected genres' : 'yet'}</p>
                        ) : (
                          completedBooks.map((book) => (
                            <div key={book.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                              <img
                                src={book.cover_image || 'https://via.placeholder.com/100x150?text=No+Cover'}
                                alt={book.title}
                                className="w-16 h-24 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{book.title}</h4>
                                <p className="text-sm text-gray-600">{book.author}</p>
                                <div className="mt-4 flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' read online')}`, '_blank')}
                                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-95 transition-all duration-200 uppercase tracking-wide"
                                  >
                                    Read
                                  </button>
                                  <button
                                    onClick={() => deleteBook(book.id!)}
                                    className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 hover:shadow-lg active:scale-95 transition-all duration-200 uppercase tracking-wide"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl"></span>
                My Wishlist
                <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">
                  {wishlistBooks.length}
                </span>
              </h3>
              <div className="space-y-3">
                {wishlistBooks.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Your wishlist is empty</p>
                ) : (
                  wishlistBooks.slice(0, 3).map((book) => (
                    <div key={book.id} className="flex gap-3">
                      <img
                        src={book.cover_image || 'https://via.placeholder.com/50x75?text=No+Cover'}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{book.title}</h4>
                        <p className="text-xs text-gray-600 truncate">{book.author}</p>
                        <button
                          onClick={() => updateBookStatus(book.id!, 'reading', 0)}
                          className="mt-1 text-xs text-teal-600 hover:text-teal-700 hover:font-bold font-medium flex items-center gap-1 transition-all"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                          </svg>
                          Start Reading
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-1"> Books Read</span>
                    <span className="font-semibold text-gray-900">{completedBooks.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-1"> Currently Reading</span>
                    <span className="font-semibold text-gray-900">{readingBooks.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 flex items-center gap-1"> Want to Read</span>
                    <span className="font-semibold text-gray-900">{wishlistBooks.length}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                {recentActivity.length > 0 && (
                  <button onClick={clearActivity} className="text-xs text-red-600 hover:text-red-700 font-medium">Clear</button>
                )}
              </div>
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.slice(0, 10).map((act) => (
                    <li key={act.id} className="flex items-start gap-3 pb-2 border-b border-gray-100 last:border-b-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">{getActivityIcon(act.message)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{act.message}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(act.created_at).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Modals */}
      {showProfileModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="pt-6 pl-6">
              <div className="w-14 h-14 bg-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.charAt(0) || 'U'}</div>
            </div>

            <div className="p-6 pt-4 space-y-4">
              <div className="bg-teal-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Reading Stats</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-teal-600">{completedBooks.length}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{readingBooks.length}</p>
                    <p className="text-xs text-gray-600">Reading</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{wishlistBooks.length}</p>
                    <p className="text-xs text-gray-600">Wishlist</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto relative">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="pt-6 pl-6">
              <div className="h-2.5 w-24 bg-teal-600 rounded-full mb-4"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* About Us Section */}
              <div className="border-b pb-6">
                <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">📚 About BookFinder</h4>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">Your personal library for discovering, tracking, and sharing your book collection. Find your next favorite read today.</p>
                <div className="bg-teal-50 rounded-lg p-3 mb-3">
                  <h5 className="font-semibold text-gray-900 mb-2">✨ Our Mission</h5>
                  <p className="text-sm text-gray-700">To help readers build their collections, track progress, and discover their next favorite books.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <h5 className="font-semibold text-gray-900 mb-2">🤝 Features</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Search millions of books</li>
                    <li>• Track reading progress</li>
                    <li>• Build custom reading lists</li>
                    <li>• Read books online</li>
                  </ul>
                </div>
              </div>

              {/* Settings Section */}
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">⚙️ Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <span className="text-sm font-medium text-gray-900">Notifications</span>
                    <input type="checkbox" className="w-5 h-5 accent-teal-600 cursor-pointer" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <span className="text-sm font-medium text-gray-900">Dark Mode</span>
                    <input type="checkbox" className="w-5 h-5 accent-teal-600 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <span className="text-sm font-medium text-gray-900">Public Profile</span>
                    <input type="checkbox" className="w-5 h-5 accent-teal-600 cursor-pointer" defaultChecked />
                  </div>
                </div>
              </div>

              {/* Account Section */}
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">👤 Account</h4>
                <button className="w-full p-3 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21H3v-3.5L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showListsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-96 overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">My Lists</h3>
                <button onClick={() => setShowListsModal(false)} className="text-white/80 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📚</span>
                    <span>Wishlist ({wishlistBooks.length})</span>
                  </h4>
                  {wishlistBooks.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No books yet. Start adding!</p>
                  ) : (
                    <ul className="space-y-2">
                      {wishlistBooks.map(b => (
                        <li key={b.id} className="text-sm text-gray-700 bg-gray-50 p-2 rounded flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{b.title}</p>
                            <p className="text-xs text-gray-500">{b.author}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">▶</span>
                    <span>Currently Reading ({readingBooks.length})</span>
                  </h4>
                  {readingBooks.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Not reading any books right now.</p>
                  ) : (
                    <ul className="space-y-2">
                      {readingBooks.map(b => (
                        <li key={b.id} className="text-sm text-gray-700 bg-blue-50 p-2 rounded flex justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{b.title}</p>
                            <p className="text-xs text-gray-500">{b.progress}% complete</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          

            {/* Content */}
            <div className="px-6 pb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign out?</h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to sign out? You can always sign back in anytime.
              </p>

              {/* Tip */}
              <p className="text-xs text-gray-500 mb-6">
                <span className="font-semibold">Tip:</span> Check "Remember me" on login to stay signed in longer
              </p>

              {/* Buttons */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="w-2/5 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="w-3/5 px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}