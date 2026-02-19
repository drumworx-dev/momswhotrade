import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { GHOST_CONFIG } from '../../config/ghost';
import type { BlogPost } from '../../types';
import { formatDate } from '../../utils/formatters';

interface ArticleReaderProps {
  post: BlogPost;
  onClose: () => void;
}

const FONT_SIZES = [14, 16, 18, 20] as const;

export function ArticleReader({ post, onClose }: ArticleReaderProps) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [fontSizeIdx, setFontSizeIdx] = useState(1); // default = 16px

  const fontSize = FONT_SIZES[fontSizeIdx];

  useEffect(() => {
    const { url, key } = GHOST_CONFIG;

    if (!key) {
      // No API key — show excerpt as fallback
      setHtml(`<p>${post.excerpt}</p><p style="color:#999;font-size:13px;margin-top:24px;">Full article requires Ghost API key.</p>`);
      setLoading(false);
      return;
    }

    fetch(`${url}/ghost/api/content/posts/slug/${post.slug}/?key=${key}&formats=html`)
      .then(r => r.json())
      .then(data => {
        setHtml(data.posts?.[0]?.html || `<p>${post.excerpt}</p>`);
      })
      .catch(() => {
        setHtml(`<p>${post.excerpt}</p>`);
      })
      .finally(() => setLoading(false));
  }, [post.slug, post.excerpt]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Sticky header */}
      <div className="flex-none bg-white border-b border-gray-100 px-4 pt-safe-top pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-dim text-text-secondary hover:bg-bg-secondary transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>

        <span className="flex-1 font-semibold text-text-primary text-sm line-clamp-1">{post.title}</span>

        {/* Font size controls */}
        <div className="flex items-center gap-1 bg-surface-dim rounded-full px-1 py-1 flex-shrink-0">
          <button
            onClick={() => setFontSizeIdx(i => Math.max(0, i - 1))}
            disabled={fontSizeIdx === 0}
            className="w-7 h-7 flex items-center justify-center rounded-full text-text-secondary disabled:opacity-30 hover:bg-white transition-colors"
          >
            <Minus size={13} />
          </button>
          <span className="text-xs font-medium text-text-tertiary w-7 text-center">{fontSize}</span>
          <button
            onClick={() => setFontSizeIdx(i => Math.min(FONT_SIZES.length - 1, i + 1))}
            disabled={fontSizeIdx === FONT_SIZES.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-full text-text-secondary disabled:opacity-30 hover:bg-white transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Feature image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={post.feature_image}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Article meta + body */}
        <div className="px-5 py-6 max-w-2xl mx-auto pb-24">
          {/* Tag */}
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-surface-dim text-text-secondary mb-3">
            {post.tag}
          </span>

          {/* Title */}
          <h1 className="font-bold text-text-primary leading-tight mb-3" style={{ fontSize: fontSize + 6 }}>
            {post.title}
          </h1>

          {/* Byline */}
          <div className="flex items-center gap-2 text-xs text-text-tertiary mb-6 pb-5 border-b border-gray-100">
            <div className="w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {post.author[0]}
            </div>
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.reading_time} min read</span>
            <span>·</span>
            <span>{formatDate(post.published_at)}</span>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-text-secondary text-sm">Loading article…</p>
            </div>
          ) : (
            <div
              className="article-body text-text-primary leading-relaxed"
              style={{ fontSize }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>

      {/* Article body styles (injected globally via a style tag in index.html is ideal,
          but a scoped approach works for the MVP) */}
      <style>{`
        .article-body h1, .article-body h2, .article-body h3 {
          font-weight: 700; margin: 1.4em 0 0.5em; line-height: 1.3;
        }
        .article-body h2 { font-size: 1.25em; }
        .article-body h3 { font-size: 1.1em; }
        .article-body p  { margin: 0 0 1em; }
        .article-body ul, .article-body ol { margin: 0 0 1em; padding-left: 1.5em; }
        .article-body li { margin-bottom: 0.35em; }
        .article-body a  { color: #E8A598; text-decoration: underline; }
        .article-body strong { font-weight: 700; }
        .article-body em { font-style: italic; }
        .article-body blockquote {
          border-left: 3px solid #E8A598; margin: 1em 0; padding: 0.5em 1em;
          color: #666; font-style: italic;
        }
        .article-body img { max-width: 100%; border-radius: 12px; margin: 1em 0; }
        .article-body figure { margin: 1em 0; }
        .article-body figcaption { font-size: 0.8em; color: #999; text-align: center; margin-top: 0.25em; }
        .article-body pre, .article-body code {
          background: #f5f5f5; border-radius: 6px; font-family: monospace; font-size: 0.85em;
        }
        .article-body pre { padding: 1em; overflow-x: auto; }
        .article-body code { padding: 0.15em 0.4em; }
        .article-body hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
      `}</style>
    </div>
  );
}
