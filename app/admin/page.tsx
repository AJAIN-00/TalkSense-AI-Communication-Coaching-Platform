'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_blocked: boolean;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        throw new Error('Forbidden');
      }
      const data = await res.json();
      setUsers(data.profiles || []);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [router]);

  async function handleToggleBlock(userId: string, currentlyBlocked: boolean) {
    setActionUserId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { is_blocked: !currentlyBlocked },
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_blocked: !currentlyBlocked } : u))
        );
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update user status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionUserId(null);
    }
  }

  async function handleToggleRole(userId: string, currentRole: 'user' | 'admin') {
    setActionUserId(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { role: newRole },
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionUserId(null);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04070f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#00d4ff', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#04070f' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800 bg-navy-800">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <svg className="w-5 h-5 text-gray-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-display font-bold text-lg text-white">Back to Dashboard</span>
        </Link>
        <span className="font-display font-bold text-lg gradient-text">TalkSense Admin Portal</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">User Administration</h1>
          <p className="text-sm" style={{ color: '#8892a4' }}>
            Manage visitors, toggle roles, and edit block status. Blocked users will only ever see a generic &quot;Invalid email or password&quot; error when attempting to sign in.
          </p>
        </div>

        {/* Filter / Search input */}
        <div className="flex gap-4 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-field"
          />
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-white/[0.02]" style={{ color: '#8892a4' }}>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">User Details</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">Joined Date</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm" style={{ color: '#4a5568' }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white text-sm">{user.full_name || 'N/A'}</div>
                        <div className="text-xs" style={{ color: '#8892a4' }}>{user.email}</div>
                        <div className="text-[10px] font-mono mt-1" style={{ color: '#4a5568' }}>{user.id}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-800 text-gray-400'}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4">
                        {user.is_blocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          disabled={actionUserId !== null}
                          className="px-3 py-1 rounded text-xs font-semibold border border-white/10 hover:border-white/20 bg-white/5 text-gray-300 hover:text-white transition-all"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleToggleBlock(user.id, user.is_blocked)}
                          disabled={actionUserId !== null}
                          className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${user.is_blocked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                        >
                          {user.is_blocked ? 'Unblock' : 'Block User'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
