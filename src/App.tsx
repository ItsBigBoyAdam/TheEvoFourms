import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, orderBy, onSnapshot, where, limit, doc, getDoc, getDocs } from 'firebase/firestore';
import { Post } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PostCard from './components/PostCard';
import PostSkeleton from './components/PostSkeleton';
import CreatePostModal from './components/CreatePostModal';
import CommentSection from './components/CommentSection';
import ProfilePage from './components/ProfilePage';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './components/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, Flame, Sparkles, BookOpen, Search } from 'lucide-react';
import { cn } from './lib/utils';

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'following'>('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    
    if (sortBy === 'following' && auth.currentUser) {
      const fetchFollowingPosts = async () => {
        const followQ = query(collection(db, 'follows'), where('followerId', '==', auth.currentUser?.uid));
        const snapshot = await getDocs(followQ);
        const ids = snapshot.docs.map(doc => doc.data().followingId);
        
        if (ids.length === 0) {
          setPosts([]);
          setLoading(false);
          return () => {};
        }

        const q = query(
          collection(db, 'posts'),
          where('authorId', 'in', ids.slice(0, 30)),
          orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
          const fetchedPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          setPosts(fetchedPosts);
          setLoading(false);
        });
      };

      let unsubscribe: () => void = () => {};
      fetchFollowingPosts().then(unsub => {
        unsubscribe = unsub;
      });

      return () => unsubscribe();
    } else {
      let q = query(collection(db, 'posts'), orderBy(sortBy === 'newest' ? 'createdAt' : 'likesCount', 'desc'));
      
      if (activeTag) {
        q = query(collection(db, 'posts'), where('tags', 'array-contains', activeTag), orderBy('createdAt', 'desc'));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        let filtered = fetchedPosts;
        if (searchQuery) {
          filtered = fetchedPosts.filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setPosts(filtered);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [activeTag, searchQuery, sortBy]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setTrendingPosts(fetched);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto flex gap-8">
        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-evo-yellow" />
              <h2 className="text-xl font-bold">
                {activeTag ? `Discussions in #${activeTag}` : 'Community Feed'}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl">
              <button
                onClick={() => setSortBy('newest')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  sortBy === 'newest' ? "bg-evo-orange text-evo-dark shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                <Clock className="w-4 h-4" />
                Newest
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  sortBy === 'popular' ? "bg-evo-orange text-evo-dark shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                <Flame className="w-4 h-4" />
                Popular
              </button>
              {auth.currentUser && (
                <button
                  onClick={() => setSortBy('following')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    sortBy === 'following' ? "bg-evo-orange text-evo-dark shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Following
                </button>
              )}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))
              ) : (
                posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onTagClick={(tag) => setActiveTag(tag)}
                    isTrending={trendingPosts.some(tp => tp.id === post.id)}
                  />
                ))
              )}
            </AnimatePresence>
            
            {posts.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-20 text-center flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
                  <Search className="w-10 h-10 text-white/10" />
                </div>
                <h3 className="text-xl font-bold">No discussions found</h3>
                <p className="text-white/20 max-w-xs mx-auto">
                  We couldn't find any discussions matching your search or filters. Try adjusting them!
                </p>
                <button 
                  onClick={() => { setActiveTag(null); setSearchQuery(''); }}
                  className="mt-2 text-evo-orange hover:underline font-bold"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <Sidebar 
          activeTag={activeTag} 
          onTagSelect={setActiveTag} 
          trendingPosts={trendingPosts}
        />
      </div>

      <Navbar 
        onSearch={setSearchQuery} 
        onCreatePost={() => setIsCreateModalOpen(true)} 
      />
      
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}

function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const postRef = doc(db, 'posts', id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        setPost({ id: doc.id, ...doc.data() } as Post);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-evo-orange border-t-transparent rounded-full animate-spin" />
  </div>;

  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <h2 className="text-2xl font-bold">Post not found</h2>
    <Link to="/" className="evo-button">Back to Home</Link>
  </div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-evo-orange transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Feed
        </Link>

        <article className="glass rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <img
              src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
              alt={post.authorName}
              className="w-14 h-14 rounded-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-1">{post.title}</h1>
              <p className="text-white/40 text-sm">
                Posted by <span className="text-evo-orange font-bold">{post.authorName}</span> • {post.createdAt.toDate().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-12">
            <p className="text-lg text-white/80 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map(tag => (
              <span key={tag} className="px-4 py-1.5 rounded-full bg-evo-orange/10 text-evo-orange border border-evo-orange/20 text-sm font-bold">
                #{tag}
              </span>
            ))}
          </div>
        </article>

        <div className="glass rounded-3xl p-8 md:p-12">
          <CommentSection postId={post.id} />
        </div>
      </div>

      <Navbar onSearch={() => {}} onCreatePost={() => {}} />

      <footer className="mt-20 text-center py-8 border-t border-white/5">
        <p className="text-white/20 text-sm">
          Powered by <span className="evo-gradient-text">EvoTeam™</span>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/profile/:uid" element={<ProfilePage />} />
        </Routes>
        <ScrollToTop />
      </Router>
    </ToastProvider>
  );
}
