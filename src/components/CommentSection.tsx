import React, { useState, useEffect } from 'react';
import { Comment } from '../types';
import { auth, db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { Send, User as UserIcon, AlertTriangle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import ReportModal from './ReportModal';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const user = auth.currentUser;
  const { showToast } = useToast();

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
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        postId,
        content: newComment,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        createdAt: Timestamp.now(),
      });
      showToast("Reply posted!", "success");
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment", error);
      showToast("Failed to post reply.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
      showToast("Reply deleted.", "success");
    } catch (error) {
      console.error("Error deleting comment", error);
      showToast("Failed to delete reply.", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          Replies
          <span className="text-sm font-normal text-white/40 bg-white/5 px-2 py-1 rounded-lg">
            {comments.length}
          </span>
        </h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a reply..."
            rows={3}
            className="w-full p-4 rounded-2xl glass border-white/10 focus:border-evo-orange/50 outline-none transition-all resize-none pr-16"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-4 bottom-4 p-3 rounded-xl bg-evo-orange text-evo-dark hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      ) : (
        <div className="glass rounded-2xl p-6 text-center border-dashed border-white/10">
          <p className="text-white/40 mb-4">You must be signed in to reply.</p>
          <button
            onClick={() => auth.currentUser || signInWithGoogle()}
            className="evo-button"
          >
            Sign In with Google
          </button>
        </div>
      )}

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {comments.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4"
            >
              <img
                src={comment.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`}
                alt={comment.authorName}
                className="w-10 h-10 rounded-xl border border-white/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 glass rounded-2xl p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-evo-yellow">
                    {comment.authorName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/20">
                      {formatDistanceToNow(comment.createdAt.toDate())} ago
                    </span>
                    {(user?.uid === comment.authorId || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-white/10 hover:text-red-500 transition-colors"
                        title="Delete Reply"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {user && user.uid !== comment.authorId && !isAdmin && (
                      <button
                        onClick={() => setReportingCommentId(comment.id)}
                        className="text-white/10 hover:text-red-500 transition-colors"
                        title="Report Comment"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <MessageSquareIcon className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-white/20">No replies yet. Be the first to join the discussion!</p>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={!!reportingCommentId}
        onClose={() => setReportingCommentId(null)}
        targetId={reportingCommentId || ''}
        targetType="comment"
      />
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

async function signInWithGoogle() {
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}
