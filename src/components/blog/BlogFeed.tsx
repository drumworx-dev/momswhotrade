import { useState } from 'react';
import { motion } from 'framer-motion';
import { BlogCard } from './BlogCard';
import { mockPosts } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';

const tabs = ['Latest', 'Beginners Guide', 'Trade Ideas'];

export function BlogFeed() {
  const [activeTab, setActiveTab] = useState('Latest');
  const { user, signOut } = useAuth();

  const filtered = activeTab === 'Latest'
    ? mockPosts
    : mockPosts.filter(p => p.tag === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <rect x="5" y="20" width="6" height="15" rx="1.5" fill="#2D2D2D"/>
              <rect x="15" y="13" width="6" height="22" rx="1.5" fill="#2D2D2D"/>
              <rect x="25" y="6" width="6" height="29" rx="1.5" fill="#2D2D2D"/>
              <path d="M5 18 L18 12 L28 5" stroke="#D4A5A5" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-bold text-text-primary text-base">Moms Who Trade</span>
          </div>
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-full overflow-hidden bg-accent-primary flex items-center justify-center"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-semibold">
                {user?.displayName?.[0] || 'M'}
              </span>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-none px-4 py-2 rounded-pill text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-text-primary text-white'
                  : 'bg-surface-dim text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto bg-bg-primary px-4 py-4 pb-24">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {filtered.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <BlogCard post={post} />
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-text-secondary">
              <div className="text-4xl mb-3">📝</div>
              <p>No posts in this category yet</p>
            </div>
          )}

          {/* Ghost API Notice */}
          <div className="bg-white rounded-card p-4 shadow-sm mt-2">
            <p className="text-center text-xs text-text-tertiary">
              📡 Connect Ghost CMS API for live posts from momswhotrade.co
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
