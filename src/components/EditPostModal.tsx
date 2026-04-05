import React, { useState } from 'react';
import { X, Send, Hash, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Post } from '../types';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

const TAGS = ['Hosting', 'WebDev', 'EvoTools', 'EvoTeam', 'Help', 'General'];

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export default function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [selectedTags, setSelectedTags] = useState<string[]>(post.tags);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        title,
        content,
        tags: selectedTags,
        updatedAt: Timestamp.now(),
      });
      showToast("Post updated successfully!", "success");
      onClose();
    } catch (error) {
      console.error("Error updating post", error);
      showToast("Failed to update post.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-evo-dark/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <EditIcon className="w-6 h-6 text-evo-orange" />
                Edit Discussion
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Discussion Title
                  </label>
                  <span className={cn("text-[10px]", title.length > 180 ? "text-red-400" : "text-white/20")}>
                    {title.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  className="evo-input text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Select Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                        selectedTags.includes(tag)
                          ? "bg-evo-orange text-evo-dark border-evo-orange shadow-[0_0_15px_rgba(255,140,0,0.3)]"
                          : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Content
                  </label>
                  <span className={cn("text-[10px]", content.length > 9000 ? "text-red-400" : "text-white/20")}>
                    {content.length}/10000
                  </span>
                </div>
                <textarea
                  required
                  maxLength={10000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, questions, or ideas..."
                  rows={6}
                  className="evo-input resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-white/20">
                  Last updated: {post.updatedAt.toDate().toLocaleString()}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="evo-button flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
