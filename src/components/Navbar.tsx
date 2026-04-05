import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { LogIn, LogOut, Plus, Search, User as UserIcon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

interface NavbarProps {
  onSearch: (query: string) => void;
  onCreatePost: () => void;
}

export default function Navbar({ onSearch, onCreatePost }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const wasLoggedIn = !!user;
      setUser(currentUser);
      
      if (currentUser && !wasLoggedIn) {
        showToast(`Welcome back, ${currentUser.displayName}!`, "success");
        // Ensure user exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: 'user',
            createdAt: Timestamp.now(),
          });
        }
      } else if (!currentUser && wasLoggedIn) {
        showToast("Logged out successfully.", "info");
      }
    });
    return () => unsubscribe();
  }, [user, showToast]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      showToast("Failed to logout.", "error");
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      showToast("Failed to sign in.", "error");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-evo-orange to-evo-yellow flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <span className="text-evo-dark font-black text-xl">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Evo<span className="evo-gradient-text">Fourms™</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative group hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-evo-orange transition-colors" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-11 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-evo-orange/50 outline-none transition-all placeholder:text-white/20"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={onCreatePost}
                className="evo-button hidden sm:flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </button>
              
              <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-2" />
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs text-white/40">Member</p>
                </div>
                <Link to={`/profile/${user.uid}`} className="hover:scale-110 transition-transform">
                  <img
                    src={user.photoURL || ''}
                    alt={user.displayName || ''}
                    className="w-10 h-10 rounded-xl border border-white/10 hover:border-evo-orange transition-colors"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="evo-button flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-white/5"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-11 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 outline-none"
              />
            </div>
            {user && (
              <button
                onClick={() => {
                  onCreatePost();
                  setIsMenuOpen(false);
                }}
                className="evo-button flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
