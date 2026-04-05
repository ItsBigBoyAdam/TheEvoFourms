import React from 'react';

export default function PostSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5" />
        <div className="space-y-2">
          <div className="w-24 h-3 bg-white/5 rounded" />
          <div className="w-16 h-2 bg-white/5 rounded" />
        </div>
      </div>
      <div className="w-3/4 h-6 bg-white/5 rounded" />
      <div className="space-y-2">
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-full h-3 bg-white/5 rounded" />
        <div className="w-1/2 h-3 bg-white/5 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="w-16 h-6 bg-white/5 rounded-full" />
        <div className="w-16 h-6 bg-white/5 rounded-full" />
      </div>
      <div className="pt-4 border-t border-white/5 flex gap-6">
        <div className="w-12 h-4 bg-white/5 rounded" />
        <div className="w-12 h-4 bg-white/5 rounded" />
      </div>
    </div>
  );
}
