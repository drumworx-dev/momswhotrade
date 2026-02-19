import type { BlogPost } from '../../types';
import { formatDate } from '../../utils/formatters';

interface BlogCardProps {
  post: BlogPost;
  onClick?: () => void;
}

export function BlogCard({ post, onClick }: BlogCardProps) {
  const tagColors: Record<string, string> = {
    'Beginners Guide': 'bg-bg-secondary text-accent-dark',
    'Trade Ideas': 'bg-green-50 text-accent-success',
  };

  return (
    <div onClick={onClick} className="bg-white rounded-card shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 active:scale-[0.99]">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={post.feature_image}
          alt={post.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Badge */}
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2 ${tagColors[post.tag] || 'bg-surface-dim text-text-secondary'}`}>
          {post.tag}
        </span>

        {/* Title */}
        <h3 className="font-bold text-text-primary text-base leading-snug line-clamp-2 mb-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-text-secondary text-sm leading-relaxed line-clamp-3 mb-3">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <div className="w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center text-white text-xs font-semibold">
            {post.author[0]}
          </div>
          <span>{post.author}</span>
          <span>•</span>
          <span>{post.reading_time} min read</span>
          <span className="ml-auto">{formatDate(post.published_at)}</span>
        </div>
      </div>
    </div>
  );
}
