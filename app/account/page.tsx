'use client';

import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../components/ThemeProvider';
import { apiUrl, authHeaders } from '@/lib/api';

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z'
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z'
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z'
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z'
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'
      />
    </svg>
  );
}

interface SharedUser {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface AlbumData {
  _id: string;
  name: string;
  albumDate: string;
  createdAt: string;
  photoCount: number;
  userRole: string;
  isOwner: boolean;
  sharedWith: SharedUser[];
  sharedCount: number;
}

interface Stats {
  totalAlbums: number;
  totalPhotos: number;
  storageInGB: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDate, setAlbumDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [stats, setStats] = useState<Stats>({ totalAlbums: 0, totalPhotos: 0, storageInGB: '0' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('all');

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumData | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor' | 'owner'>('viewer');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState('');

  // Manage shared users modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAlbumsAndStats();
    }
  }, [status]);

  const fetchAlbumsAndStats = async () => {
    try {
      const token = session?.accessToken || '';
      const headers = authHeaders(token);
      const [albumsRes, statsRes] = await Promise.all([
        fetch(apiUrl('/api/albums'), { headers }),
        fetch(apiUrl('/api/albums/stats'), { headers }),
      ]);

      if (albumsRes.ok) {
        const albumsData = await albumsRes.json();
        setAlbums(albumsData.albums);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAlbums = () => {
    let filtered = albums;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((album) => album.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Filter by selected month/year
    if (selectedMonthYear !== 'all') {
      filtered = filtered.filter((album) => {
        const date = new Date(album.albumDate);
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        return monthYear === selectedMonthYear;
      });
    }

    return filtered;
  };

  const groupAlbumsByMonth = () => {
    const filtered = getFilteredAlbums();
    const grouped: Record<string, AlbumData[]> = {};

    filtered.forEach((album) => {
      const date = new Date(album.albumDate);
      const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(album);
    });

    return grouped;
  };

  const getAvailableMonthYears = () => {
    const monthYears = new Set<string>();
    albums.forEach((album) => {
      const date = new Date(album.albumDate);
      const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthYears.add(monthYear);
    });
    return Array.from(monthYears).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });
  };

  if (status === 'loading') {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/' });
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreatingAlbum(true);

    try {
      const response = await fetch(apiUrl('/api/albums'), {
        method: 'POST',
        headers: authHeaders(session?.accessToken || ''),
        body: JSON.stringify({ name: albumName, albumDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create album');
        return;
      }

      // Close modal and reset form
      setShowCreateModal(false);
      setAlbumName('');
      setAlbumDate(new Date().toISOString().split('T')[0]);

      // Navigate to the album page
      router.push(`/album/${data.album._id}`);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const handleShareAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum) return;

    setShareError('');
    setIsSharing(true);

    try {
      const response = await fetch(apiUrl(`/api/albums/${selectedAlbum._id}/share`), {
        method: 'POST',
        headers: authHeaders(session?.accessToken || ''),
        body: JSON.stringify({ email: shareEmail, role: shareRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        setShareError(data.error || 'Failed to share album');
        return;
      }

      toast.success(data.message);
      setShareEmail('');
      setShareRole('viewer');
      setShowShareModal(false);
      fetchAlbumsAndStats(); // Refresh the albums list
    } catch {
      setShareError('An error occurred. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!selectedAlbum) return;

    setIsRevoking(userId);

    try {
      const response = await fetch(apiUrl(`/api/albums/${selectedAlbum._id}/share?userId=${userId}`), {
        method: 'DELETE',
        headers: authHeaders(session?.accessToken || ''),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to revoke access');
        return;
      }

      toast.success('Access revoked successfully');
      fetchAlbumsAndStats(); // Refresh the albums list

      // Update local state for the modal
      setSelectedAlbum({
        ...selectedAlbum,
        sharedWith: selectedAlbum.sharedWith.filter((u) => u.userId !== userId),
        sharedCount: selectedAlbum.sharedCount - 1,
      });
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsRevoking(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'viewer' | 'editor' | 'owner') => {
    if (!selectedAlbum) return;

    setIsUpdatingRole(userId);

    try {
      const response = await fetch(apiUrl(`/api/albums/${selectedAlbum._id}/share`), {
        method: 'PATCH',
        headers: authHeaders(session?.accessToken || ''),
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to update role');
        return;
      }

      toast.success(`Role updated to ${newRole}`);
      fetchAlbumsAndStats(); // Refresh the albums list

      // Update local state for the modal
      setSelectedAlbum({
        ...selectedAlbum,
        sharedWith: selectedAlbum.sharedWith.map((u) => (u.userId === userId ? { ...u, role: newRole } : u)),
      });
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const openShareModal = (album: AlbumData) => {
    setSelectedAlbum(album);
    setShareEmail('');
    setShareRole('viewer');
    setShareError('');
    setShowShareModal(true);
  };

  const openManageModal = (album: AlbumData) => {
    setSelectedAlbum(album);
    setShowManageModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'editor':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-2'>
            <Image
              src={theme === 'dark' ? '/images/PicsGenics.png' : '/images/PicsGenics_purple.png'}
              alt='PicsGenics'
              width={560}
              height={160}
              className='h-36 w-auto'
            />
          </div>

          <div className='flex items-center gap-6'>
            <p className='hidden text-sm font-medium text-foreground sm:block'>
              Hi, {session.user?.firstName}
            </p>
            <button
              onClick={toggleTheme}
              className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground'
              aria-label='Toggle theme'
            >
              {theme === 'light' ? <MoonIcon className='h-5 w-5' /> : <SunIcon className='h-5 w-5' />}
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className='rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-4 pt-28 pb-8 sm:px-6 lg:px-8'>
        {/* Welcome Section */}
        <div className='mb-6 rounded-2xl border border-border bg-card p-4 sm:mb-8 sm:p-8'>
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:h-16 sm:w-16'>
              <UserIcon className='h-6 w-6 text-primary sm:h-8 sm:w-8' />
            </div>
            <div>
              <h1 className='text-lg font-bold text-foreground sm:text-2xl'>Welcome back, {session.user?.name}!</h1>
              <p className='text-sm text-muted sm:text-base'>{session.user?.email}</p>
              <p className='mt-1 text-xs text-muted sm:mt-2 sm:text-sm'>
                {loading ? (
                  'Loading stats...'
                ) : (
                  <>
                    {stats.totalPhotos} photos - {stats.totalAlbums} albums - {stats.storageInGB} GB storage used
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Albums Section */}
        <div className='mb-6 sm:mb-8'>
          <div className='mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between'>
            <h2 className='text-xl font-bold text-foreground sm:text-2xl'>My Albums</h2>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              {/* Search Input */}
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search albums...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full rounded-lg border border-border bg-background px-4 py-2 pl-10 text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64'
                />
                <svg
                  className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                  />
                </svg>
              </div>

              {/* Month/Year Filter */}
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className='rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
              >
                <option value='all'>All Months</option>
                {getAvailableMonthYears().map((monthYear) => (
                  <option
                    key={monthYear}
                    value={monthYear}
                  >
                    {monthYear}
                  </option>
                ))}
              </select>

              {/* Create Album Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover'
              >
                Create Album
              </button>
            </div>
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
            </div>
          ) : albums.length === 0 ? (
            <div className='rounded-2xl border border-border bg-card p-12 text-center'>
              <div className='mb-4 flex justify-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-accent/10'>
                  <FolderIcon className='h-8 w-8 text-accent' />
                </div>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-foreground'>No albums yet</h3>
              <p className='mb-6 text-muted'>Create your first album to start organizing your photos</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className='rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover'
              >
                Create Your First Album
              </button>
            </div>
          ) : getFilteredAlbums().length === 0 ? (
            <div className='rounded-2xl border border-border bg-card p-12 text-center'>
              <div className='mb-4 flex justify-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-accent/10'>
                  <svg
                    className='h-8 w-8 text-accent'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                    />
                  </svg>
                </div>
              </div>
              <h3 className='mb-2 text-xl font-semibold text-foreground'>No albums found</h3>
              <p className='mb-6 text-muted'>Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMonthYear('all');
                }}
                className='rounded-lg border border-border bg-background px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary'
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className='space-y-8'>
              {Object.entries(groupAlbumsByMonth()).map(([monthYear, monthAlbums]) => (
                <div key={monthYear}>
                  <h3 className='mb-4 text-lg font-semibold text-foreground'>{monthYear}</h3>
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {monthAlbums.map((album) => (
                      <div
                        key={album._id}
                        className='group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg'
                      >
                        <button
                          onClick={() => router.push(`/album/${album._id}`)}
                          className='w-full text-left'
                        >
                          <div className='mb-4 flex items-start justify-between'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20'>
                              <FolderIcon className='h-6 w-6 text-accent' />
                            </div>
                            <div className='flex flex-col items-end gap-1'>
                              <span className='rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
                                {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                              </span>
                              {!album.isOwner && (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(album.userRole)}`}
                                >
                                  {album.userRole}
                                </span>
                              )}
                            </div>
                          </div>
                          <h4 className='mb-2 text-lg font-semibold text-foreground'>{album.name}</h4>
                          <p className='text-sm text-muted'>
                            {new Date(album.albumDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </button>

                        {/* Sharing info and actions - only for owners */}
                        {album.isOwner && (
                          <div className='mt-4 flex items-center justify-between border-t border-border pt-4'>
                            <div className='flex items-center gap-2'>
                              {album.sharedCount > 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openManageModal(album);
                                  }}
                                  className='flex items-center gap-1 text-xs text-muted hover:text-foreground'
                                >
                                  <UsersIcon className='h-4 w-4' />
                                  <span>Shared with {album.sharedCount}</span>
                                </button>
                              ) : (
                                <span className='flex items-center gap-1 text-xs text-muted'>
                                  <UsersIcon className='h-4 w-4' />
                                  <span>Not shared</span>
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openShareModal(album);
                              }}
                              className='flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20'
                            >
                              <ShareIcon className='h-3.5 w-3.5' />
                              Share
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-card p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-foreground'>Create New Album</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                  setAlbumName('');
                  setAlbumDate(new Date().toISOString().split('T')[0]);
                }}
                className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAlbum}>
              {error && (
                <div className='mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400'>{error}</div>
              )}

              <div className='mb-4'>
                <label
                  htmlFor='albumName'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Album Name
                </label>
                <input
                  type='text'
                  id='albumName'
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                  placeholder='Enter album name'
                />
              </div>

              <div className='mb-6'>
                <label
                  htmlFor='albumDate'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Album Date
                </label>
                <input
                  type='date'
                  id='albumDate'
                  value={albumDate}
                  onChange={(e) => setAlbumDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
              </div>

              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setAlbumName('');
                    setAlbumDate(new Date().toISOString().split('T')[0]);
                  }}
                  className='flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isCreatingAlbum}
                  className='flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isCreatingAlbum ? 'Creating...' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Album Modal */}
      {showShareModal && selectedAlbum && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-card p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-foreground'>Share Album</h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareError('');
                }}
                className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <p className='mb-4 text-sm text-muted'>
              Share &quot;{selectedAlbum.name}&quot; with others by entering their email address.
            </p>

            <form onSubmit={handleShareAlbum}>
              {shareError && (
                <div className='mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400'>
                  {shareError}
                </div>
              )}

              <div className='mb-4'>
                <label
                  htmlFor='shareEmail'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Email Address
                </label>
                <input
                  type='email'
                  id='shareEmail'
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                  className='w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                  placeholder='Enter email address'
                />
              </div>

              <div className='mb-6'>
                <label
                  htmlFor='shareRole'
                  className='mb-2 block text-sm font-medium text-foreground'
                >
                  Permission Level
                </label>
                <select
                  id='shareRole'
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as 'viewer' | 'editor' | 'owner')}
                  className='w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                >
                  <option value='viewer'>Viewer - Can view photos and videos</option>
                  <option value='editor'>Editor - Can view, upload, and delete</option>
                  <option value='owner'>Owner - Full access including sharing</option>
                </select>
              </div>

              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => {
                    setShowShareModal(false);
                    setShareError('');
                  }}
                  className='flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSharing}
                  className='flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isSharing ? 'Sharing...' : 'Share Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Shared Users Modal */}
      {showManageModal && selectedAlbum && (
        <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4'>
          <div className='max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6'>
            <div className='mb-3 flex items-center justify-between sm:mb-4'>
              <h2 className='text-lg font-bold text-foreground sm:text-xl'>Manage Access</h2>
              <button
                onClick={() => setShowManageModal(false)}
                className='rounded-lg p-2 text-muted hover:bg-secondary hover:text-foreground'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <p className='mb-3 text-xs text-muted sm:mb-4 sm:text-sm'>
              People with access to &quot;{selectedAlbum.name}&quot;
            </p>

            {selectedAlbum.sharedWith.length === 0 ? (
              <div className='py-6 text-center sm:py-8'>
                <UsersIcon className='mx-auto mb-2 h-10 w-10 text-muted sm:h-12 sm:w-12' />
                <p className='text-xs text-muted sm:text-sm'>This album hasn&apos;t been shared with anyone yet.</p>
                <button
                  onClick={() => {
                    setShowManageModal(false);
                    openShareModal(selectedAlbum);
                  }}
                  className='mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover'
                >
                  Share Album
                </button>
              </div>
            ) : (
              <div className='max-h-60 space-y-2 overflow-y-auto sm:max-h-80 sm:space-y-3'>
                {selectedAlbum.sharedWith.map((user) => (
                  <div
                    key={user.userId}
                    className='flex flex-col gap-2 rounded-lg border border-border bg-background p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3'
                  >
                    <div className='flex items-center gap-2 sm:gap-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10'>
                        <UserIcon className='h-4 w-4 text-primary sm:h-5 sm:w-5' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-xs font-medium text-foreground sm:text-sm'>{user.name}</p>
                        <p className='truncate text-xs text-muted'>{user.email}</p>
                      </div>
                    </div>
                    <div className='flex items-center justify-end gap-2'>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateRole(user.userId, e.target.value as 'viewer' | 'editor' | 'owner')
                        }
                        disabled={isUpdatingRole === user.userId}
                        className={`rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${getRoleBadgeColor(user.role)}`}
                      >
                        <option value='viewer'>Viewer</option>
                        <option value='editor'>Editor</option>
                        <option value='owner'>Owner</option>
                      </select>
                      {isUpdatingRole === user.userId && (
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                      )}
                      <button
                        onClick={() => handleRevokeAccess(user.userId)}
                        disabled={isRevoking === user.userId || isUpdatingRole === user.userId}
                        className='rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2'
                        title='Revoke access'
                      >
                        {isRevoking === user.userId ? (
                          <div className='h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent' />
                        ) : (
                          <TrashIcon className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:mt-4 sm:flex-row sm:justify-between sm:pt-4'>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  openShareModal(selectedAlbum);
                }}
                className='flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20'
              >
                <ShareIcon className='h-4 w-4' />
                Add More People
              </button>
              <button
                onClick={() => setShowManageModal(false)}
                className='rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary'
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
