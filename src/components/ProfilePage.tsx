import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, limit, addDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { Post, UserProfile } from '../types';
import PostCard from './PostCard';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, Mail, Shield, User as UserIcon, MessageSquare, Heart, Flame, Clock, UserPlus, UserMinus } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { uid } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!uid) return;

    // Fetch Profile
    const fetchProfile = async () => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setProfile(userSnap.data() as UserProfile);
      }
    };

    // Fetch User Posts
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setUserPosts(fetchedPosts);
    });

    // Fetch Top Posts (Most Liked)
    const topQ = query(
      collection(db, 'posts'),
      where('authorId', '==', uid),
      orderBy('likesCount', 'desc'),
      limit(3)
    );

    const unsubscribeTop = onSnapshot(topQ, (snapshot) => {
      const fetchedTop = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setTopPosts(fetchedTop);
      setLoading(false);
    });

    // Followers Count
    const followersQ = query(collection(db, 'follows'), where('followingId', '==', uid));
    const unsubscribeFollowers = onSnapshot(followersQ, (snapshot) => {
      setFollowersCount(snapshot.size);
    });

    // Following Count
    const followingQ = query(collection(db, 'follows'), where('followerId', '==', uid));
    const unsubscribeFollowing = onSnapshot(followingQ, (snapshot) => {
      setFollowingCount(snapshot.size);
    });

    // Check if current user is following
    let unsubscribeIsFollowing = () => {};
    if (auth.currentUser && auth.currentUser.uid !== uid) {
      const isFollowingQ = query(
        collection(db, 'follows'),
        where('followerId', '==', auth.currentUser.uid),
        where('followingId', '==', uid)
      );
      unsubscribeIsFollowing = onSnapshot(isFollowingQ, (snapshot) => {
        setIsFollowing(!snapshot.empty);
      });
    }

    fetchProfile();
    return () => {
      unsubscribePosts();
      unsubscribeTop();
      unsubscribeFollowers();
      unsubscribeFollowing();
      unsubscribeIsFollowing();
    };
  }, [uid]);

  const handleFollow = async () => {
    if (!auth.currentUser || !uid || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const q = query(
          collection(db, 'follows'),
          where('followerId', '==', auth.currentUser.uid),
          where('followingId', '==', uid)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } else {
        await addDoc(collection(db, 'follows'), {
          followerId: auth.currentUser.uid,
          followingId: uid,
          createdAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error("Error following/unfollowing", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-evo-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">User not found</h2>
      <Link to="/" className="evo-button">Back to Home</Link>
    </div>
  );

  const totalLikes = userPosts.reduce((acc, post) => acc + (post.likesCount || 0), 0);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-evo-orange transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Feed
        </Link>

        {/* Profile Header */}
        <div className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-evo-orange/10 blur-3xl -mr-32 -mt-32 rounded-full" />
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
              <img
                src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`}
                alt={profile.displayName}
                className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-2 border-white/10 shadow-2xl"
                referrerPolicy="no-referrer"
              />
              {profile.role === 'admin' && (
                <div className="absolute -bottom-2 -right-2 bg-evo-orange text-evo-dark p-2 rounded-xl shadow-lg">
                  <Shield className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-4xl font-black mb-1">{profile.displayName}</h1>
                <p className="text-evo-orange font-bold text-sm tracking-widest uppercase">
                  {profile.role} Member
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/60">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-evo-yellow" />
                  <span className="text-sm">Joined {format(profile.createdAt.toDate(), 'MMMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-evo-yellow" />
                  <span className="text-sm">{userPosts.length} Discussions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-evo-yellow" />
                  <span className="text-sm">{totalLikes} Total Likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-evo-yellow" />
                  <span className="text-sm">{followersCount} Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-evo-yellow" />
                  <span className="text-sm">{followingCount} Following</span>
                </div>
              </div>

              {auth.currentUser && auth.currentUser.uid !== uid && (
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`mt-4 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    isFollowing 
                      ? "bg-white/5 text-white hover:bg-white/10" 
                      : "bg-evo-orange text-evo-dark hover:scale-105 active:scale-95"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top Contributions */}
        {topPosts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Flame className="w-6 h-6 text-evo-orange" />
              Top Contributions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPosts.map((post) => (
                <Link 
                  key={post.id} 
                  to="/" 
                  className="glass p-6 rounded-2xl hover:bg-white/5 transition-all group border border-evo-orange/20"
                >
                  <div className="flex items-center gap-2 mb-3 text-evo-orange">
                    <Heart className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">{post.likesCount} Likes</span>
                  </div>
                  <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-evo-orange transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/20">
                    <Clock className="w-3 h-3" />
                    <span>{post.tag}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* User Posts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <UserIcon className="w-6 h-6 text-evo-orange" />
            Recent Activity
          </h2>

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </AnimatePresence>

            {userPosts.length === 0 && (
              <div className="glass rounded-2xl p-20 text-center border-dashed border-white/10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-white/10" />
                </div>
                <p className="text-white/20">This user hasn't posted anything yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Navbar onSearch={setSearchQuery} onCreatePost={() => {}} />
      
      <footer className="mt-20 text-center py-8 border-t border-white/5">
        <p className="text-white/20 text-sm">
          Powered by <span className="evo-gradient-text">EvoTeam™</span>
        </p>
      </footer>
    </div>
  );
}
