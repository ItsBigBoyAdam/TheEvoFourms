import React, { useState } from 'react';
import { X, Send, Hash, Image as ImageIcon, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

const TAGS = ['Hosting', 'WebDev', 'EvoTools', 'EvoTeam', 'Help', 'General'];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !title || !content) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title,
        content,
        tags: selectedTags,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName,
        authorPhoto: auth.currentUser.photoURL,
        likesCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      showToast("Discussion posted successfully!", "success");
      setTitle('');
      setContent('');
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error("Error creating post", error);
      showToast("Failed to post discussion.", "error");
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
                <PlusIcon className="w-6 h-6 text-evo-orange" />
                Create New Discussion
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
                    <ImageIcon className="w-4 h-4" />
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
                  Follow the EvoTeam™ community guidelines.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="evo-button flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
