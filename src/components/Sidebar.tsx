import React from 'react';
import { TrendingUp, Hash, HelpCircle, Shield, Globe, Terminal, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const TAGS = [
  { name: 'Hosting', icon: Globe, color: 'text-blue-400' },
  { name: 'WebDev', icon: Terminal, color: 'text-green-400' },
  { name: 'EvoTools', icon: Zap, color: 'text-evo-yellow' },
  { name: 'EvoTeam', icon: Shield, color: 'text-evo-orange' },
  { name: 'Help', icon: HelpCircle, color: 'text-red-400' },
  { name: 'General', icon: Hash, color: 'text-purple-400' },
];

interface SidebarProps {
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
  trendingPosts: any[];
}

export default function Sidebar({ activeTag, onTagSelect, trendingPosts }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col gap-6 w-80 sticky top-24 h-fit">
      {/* Categories */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-evo-orange" />
          Categories
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => onTagSelect(null)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all",
              !activeTag ? "bg-evo-orange/20 text-evo-orange border border-evo-orange/30" : "hover:bg-white/5 text-white/60"
            )}
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">All Discussions</span>
          </button>
          
          {TAGS.map(tag => (
            <button
              key={tag.name}
              onClick={() => onTagSelect(tag.name)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all",
                activeTag === tag.name ? "bg-evo-orange/20 text-evo-orange border border-evo-orange/30" : "hover:bg-white/5 text-white/60"
              )}
            >
              <tag.icon className={cn("w-4 h-4", tag.color)} />
              <span className="font-medium">{tag.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Section */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-evo-yellow" />
          Trending Now
        </h3>
        <div className="space-y-4">
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <p className="text-xs text-evo-orange font-bold mb-1">#{i + 1} Trending</p>
                <h4 className="text-sm font-semibold group-hover:text-evo-yellow transition-colors line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                  <span>{post.likesCount} likes</span>
                  <span>•</span>
                  <span>{post.authorName}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-white/20 italic">No trending posts yet...</p>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 text-[10px] text-white/20 flex flex-wrap gap-x-4 gap-y-2">
        <span>About EvoFourms™</span>
        <span>Privacy Policy</span>
        <span>Terms of Service</span>
        <span>© 2026 EvoTeam™</span>
      </div>
    </aside>
  );
}
