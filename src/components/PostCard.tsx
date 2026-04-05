import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { MessageSquare, Heart, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import EditPostModal from './EditPostModal';
import { useToast } from './Toast';
import { BookOpen, Copy, AlertTriangle } from 'lucide-react';
import ReportModal from './ReportModal';

interface PostCardProps {
  post: Post;
  onTagClick?: (tag: string) => void;
  isTrending?: boolean;
  key?: string | number;
}

export default function PostCard({ post, onTagClick, isTrending }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const user = auth.currentUser;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const readingTime = Math.ceil(post.content.split(/\s+/).length / 200);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const adminEmails = ['elfaqiradam6@gmail.com', 'bloxyevo@gmail.com'];
      if (adminEmails.includes(user.email || '')) {
        setIsAdmin(true);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const checkLike = async () => {
      if (!user) return;
      const likeId = `${user.uid}_${post.id}`;
      const likeRef = doc(db, 'likes', likeId);
      const likeSnap = await getDoc(likeRef);
      setIsLiked(likeSnap.exists());
    };
    checkLike();
  }, [user, post.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const likeId = `${user.uid}_${post.id}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          postId: post.id,
          createdAt: new Date()
        });
        await updateDoc(postRef, { likesCount: increment(1) });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleDelete = async () => {
    if (!user || (user.uid !== post.authorId && !isAdmin)) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      showToast("Post deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting post", error);
      showToast("Failed to delete post.", "error");
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "glass glass-hover rounded-2xl p-6 group cursor-pointer relative overflow-hidden",
          isTrending && "border-evo-orange/30 shadow-[0_0_30px_rgba(255,140,0,0.1)]"
        )}
      >
        {isTrending && (
          <div className="absolute top-0 right-0 bg-gradient-to-l from-evo-orange to-evo-yellow text-evo-dark text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1 shadow-lg">
            <Flame className="w-3 h-3" />
            Trending
          </div>
        )}
        
        <Link to={`/post/${post.id}`}>
          <div className="flex items-start justify-between mb-4">
            <div 
              className="flex items-center gap-3"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/profile/${post.authorId}`);
              }}
            >
              <img
                src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
                alt={post.authorName}
                className="w-10 h-10 rounded-xl border border-white/10 hover:border-evo-orange transition-colors"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-semibold text-sm hover:text-evo-orange transition-colors">
                  {post.authorName}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>{formatDistanceToNow(post.createdAt.toDate())} ago</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {readingTime} min read
                  </span>
                </div>
              </div>
            </div>
            {(user?.uid === post.authorId || isAdmin) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-evo-orange/10 text-white/20 hover:text-evo-orange transition-all"
                  title="Edit Post"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-500 transition-all"
                  title="Delete Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {user && user.uid !== post.authorId && !isAdmin && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsReportModalOpen(true);
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-500 transition-all"
                title="Report Post"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            )}
          </div>

        <h3 className="text-xl font-bold mb-2 group-hover:translate-x-1 transition-transform">
          {post.title}
        </h3>
        
        <p className="text-white/60 line-clamp-3 mb-4 text-sm leading-relaxed">
          {post.content}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map(tag => (
            <button
              key={tag}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-evo-orange/10 text-evo-orange border border-evo-orange/20 hover:bg-evo-orange hover:text-evo-dark transition-all"
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-white/5">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-2 text-sm transition-all hover:scale-110",
              isLiked ? "text-evo-orange" : "text-white/40 hover:text-evo-orange"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            <span className="font-medium">{likesCount}</span>
          </button>

          <div className="flex items-center gap-2 text-sm text-white/40 hover:text-evo-yellow transition-all">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Reply</span>
          </div>

          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/post/${post.id}`;
              navigator.clipboard.writeText(url);
              showToast("Link copied to clipboard!", "success");
            }}
            className="ml-auto text-white/20 hover:text-evo-orange transition-all hover:scale-110"
            title="Copy Link"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </Link>
    </motion.div>

    <ConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleDelete}
      title="Delete Discussion?"
      message="This action cannot be undone. All replies and likes associated with this post will remain but the post itself will be removed."
    />

    <EditPostModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      post={post}
    />

    <ReportModal
      isOpen={isReportModalOpen}
      onClose={() => setIsReportModalOpen(false)}
      targetId={post.id}
      targetType="post"
    />
    </>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function Flame({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 3.5 6.5 1 1.5 1 2.5 1 3.5a2.5 2.5 0 0 1-5 0z"></path>
      <path d="M12 22c5.523 0 10-4.477 10-10 0-1.22-.218-2.383-.615-3.462C20.158 10.538 18.5 12 17 12c-1.5 0-3-1.5-3-3 0-1.5 1.5-3 3-3 0-1.5-1.5-3-3-3-1.5 0-3 1.5-3 3 0 1.5 1.5 3 3 3-1.5 0-3 1.5-3 3 0 1.5 1.5 3 3 3z"></path>
    </svg>
  );
}
