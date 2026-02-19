import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogCard } from './BlogCard';
import { ArticleReader } from './ArticleReader';
import { mockPosts } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import { GHOST_CONFIG } from '../../config/ghost';
import { useLoginStreak } from '../../hooks/useLoginStreak';
import type { BlogPost } from '../../types';

interface GhostPost {
  id: string;
  title: string;
  custom_excerpt: string | null;
  excerpt: string | null;
  feature_image: string | null;
  tags: Array<{ name: string }>;
  reading_time: number;
  primary_author: { name: string };
  published_at: string;
  slug: string;
}

async function fetchGhostPosts(): Promise<BlogPost[]> {
  const { url, key } = GHOST_CONFIG;
  if (!key) return [];

  const res = await fetch(
    `${url}/ghost/api/content/posts/?key=${key}&include=tags,authors&limit=all&order=published_at%20desc`
  );
  if (!res.ok) throw new Error(`Ghost API error: ${res.status}`);

  const data = await res.json();
  return (data.posts as GhostPost[]).map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.custom_excerpt || p.excerpt || '',
    feature_image: p.feature_image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    tag: p.tags?.[0]?.name || 'General',
    reading_time: p.reading_time,
    author: p.primary_author?.name || 'Mel',
    published_at: p.published_at,
    slug: p.slug,
  }));
}

export function BlogFeed() {
  const [activeTab, setActiveTab] = useState('Latest');
  const [posts, setPosts] = useState<BlogPost[]>(mockPosts);
  const [tabs, setTabs] = useState<string[]>(['Latest']);
  const [loading, setLoading] = useState(!!GHOST_CONFIG.key);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const { user, signOut } = useAuth();
  const streak = useLoginStreak();

  useEffect(() => {
    if (!GHOST_CONFIG.key) return;

    fetchGhostPosts()
      .then((fetched) => {
        if (fetched.length === 0) return;
        setPosts(fetched);
        const uniqueTags = Array.from(new Set(fetched.map((p) => p.tag)));
        setTabs(['Latest', ...uniqueTags]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === 'Latest' ? posts : posts.filter((p) => p.tag === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* In-app article reader overlay */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-0 z-50"
          >
            <ArticleReader post={selectedPost} onClose={() => setSelectedPost(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src="/icon-192.png"
              alt="Moms Who Trade"
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 40 40');
                svg.setAttribute('class', 'w-8 h-8');
                svg.innerHTML = '<rect x="5" y="20" width="6" height="15" rx="1.5" fill="#2D2D2D"/><rect x="15" y="13" width="6" height="22" rx="1.5" fill="#2D2D2D"/><rect x="25" y="6" width="6" height="29" rx="1.5" fill="#2D2D2D"/><path d="M5 18 L18 12 L28 5" stroke="#D4A5A5" stroke-width="2" stroke-linecap="round"/>';
                e.currentTarget.parentElement?.insertBefore(svg, e.currentTarget);
              }}
            />
            <span className="font-bold text-text-primary text-base">Moms Who Trade</span>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
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

        {/* Consistency streak banner */}
        {(() => {
          const bgClass  = streak.color === 'green' ? 'bg-emerald-50'  : streak.color === 'yellow' ? 'bg-yellow-50'  : 'bg-red-50';
          const dotClass = streak.color === 'green' ? 'bg-emerald-500' : streak.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
          const txtClass = streak.color === 'green' ? 'text-emerald-600' : streak.color === 'yellow' ? 'text-yellow-600' : 'text-red-600';
          return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2.5 ${bgClass}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
              <span className="text-xs font-medium text-text-secondary">Consistency is key</span>
              <div className="flex gap-0.5 ml-1">
                {Array.from({ length: streak.denominator }, (_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < streak.activeDays ? dotClass : 'bg-gray-200'}`} />
                ))}
              </div>
              <span className={`ml-auto text-xs font-bold ${txtClass}`}>
                {streak.activeDays}/{streak.denominator} days
              </span>
            </div>
          );
        })()}

        {/* Tabs — one per tag, pulled dynamically from Ghost */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => (
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

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-2xl p-6 pb-10 flex flex-col gap-3"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-text-primary text-center">Sign Out?</h3>
            <p className="text-text-secondary text-sm text-center mb-2">
              You'll need to sign in again to access your account.
            </p>
            <button
              onClick={() => { setShowLogoutModal(false); signOut(); }}
              className="w-full py-3.5 rounded-pill bg-text-primary text-white font-semibold text-sm"
            >
              Yes, sign out
            </button>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="w-full py-3 rounded-pill bg-surface-dim text-text-secondary font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto bg-bg-primary px-4 py-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">Loading posts...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-lg mx-auto">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BlogCard post={post} onClick={() => setSelectedPost(post)} />
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-text-secondary">
                <div className="text-4xl mb-3">📝</div>
                <p>No posts in this category yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
