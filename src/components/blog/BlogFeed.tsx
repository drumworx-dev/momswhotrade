import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { BlogCard } from './BlogCard';
import { ArticleReader } from './ArticleReader';
import { mockPosts } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GHOST_CONFIG } from '../../config/ghost';
import { useLoginStreak } from '../../hooks/useLoginStreak';
import { ConfettiOverlay } from '../shared/ConfettiOverlay';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useScrollDepth } from '../../hooks/useScrollDepth';
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
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showWelcomeConfetti, setShowWelcomeConfetti] = useState(false);
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const streak = useLoginStreak();
  const { track } = useAnalytics();
  const firstName = user?.displayName?.split(' ')[0] || '';

  // Show welcome confetti the very first time THIS user lands here after onboarding.
  // Flag is keyed to user.uid so a new account on the same browser still fires correctly.
  useEffect(() => {
    if (!user?.uid) return;
    const FLAG = `mwt_welcome_confetti_shown_${user.uid}`;
    if (!localStorage.getItem(FLAG)) {
      localStorage.setItem(FLAG, '1');
      // Small delay so the home screen has a moment to paint before the overlay fires.
      const t = setTimeout(() => setShowWelcomeConfetti(true), 700);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

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

  // Ref for the scrollable feed container.
  const feedRef = useRef<HTMLDivElement>(null);

  // Scroll to top instantly on every tab switch.
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  // Fire depth milestones (25/50/75/100%) per tab session.
  useScrollDepth(feedRef, activeTab, activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Welcome confetti — fires once, immediately after first post-onboarding home visit */}
      <ConfettiOverlay
        visible={showWelcomeConfetti}
        message="You've taken the first step!"
        subtext="Welcome to Moms Who Trade. Your journey starts now."
        onDone={() => setShowWelcomeConfetti(false)}
      />

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
      <div className="bg-white px-4 pb-3 sticky top-0 z-30 shadow-sm page-header">
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
            onClick={() => setShowProfileSheet(true)}
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
              <span className="text-xs font-medium text-text-secondary">
        Consistency is key{firstName ? `, ${firstName}` : ''} 🔑
      </span>
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

      {/* Profile sheet — dark mode toggle + sign out */}
      <AnimatePresence>
        {showProfileSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowProfileSheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-surface w-full max-w-sm rounded-t-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* User info */}
              <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-accent-primary flex items-center justify-center flex-shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-lg font-semibold">
                      {user?.displayName?.[0] || 'M'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">{user?.displayName || 'Trader'}</p>
                  <p className="text-text-secondary text-sm truncate">{user?.email || ''}</p>
                </div>
              </div>

              {/* Dark mode toggle row */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {isDark
                    ? <Moon size={20} className="text-accent-primary" />
                    : <Sun size={20} className="text-text-secondary" />
                  }
                  <span className="text-text-primary font-medium">Dark mode</span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle dark mode"
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    isDark ? 'bg-accent-primary' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    isDark ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 pb-10 flex flex-col gap-3">
                <button
                  onClick={() => { setShowProfileSheet(false); signOut(); }}
                  className="w-full py-3.5 rounded-pill bg-text-primary text-surface font-semibold text-sm"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => setShowProfileSheet(false)}
                  className="w-full py-3 rounded-pill bg-surface-dim text-text-secondary font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto bg-bg-primary px-4 py-4 pb-24">
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
                <BlogCard post={post} onClick={() => {
                  track({ name: 'article_read', params: { article_title: post.title, article_tag: post.tag } });
                  setSelectedPost(post);
                }} />
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
