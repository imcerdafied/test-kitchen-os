'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Logo } from './Logo';
import { Plus, User as UserIcon, LogOut, Menu, X } from 'lucide-react';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-cream-100/80 backdrop-blur-lg border-b border-cream-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-800 transition-colors"
            >
              <Plus size={16} />
              Create Recipe
            </Link>
            {user ? (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  className="inline-flex items-center gap-2 text-green-800 hover:text-green-900 px-3 py-2 rounded-full text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  <UserIcon size={16} />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 px-3 py-2 rounded-full text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-green-800 hover:text-green-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 text-green-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2">
            <Link
              href="/create"
              className="flex items-center gap-2 px-3 py-2 text-green-800 hover:bg-green-50 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              <Plus size={16} /> Create Recipe
            </Link>
            {user ? (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-green-800 hover:bg-green-50 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserIcon size={16} /> Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-green-800 hover:bg-green-50 rounded-lg w-full text-left"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-2 px-3 py-2 text-green-800 hover:bg-green-50 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
