import { ExternalLink, MessageCircle, Youtube, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

export function CommunityTab() {
  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pb-4 sticky top-0 z-30 shadow-sm page-header">
        <h1 className="text-xl font-bold text-text-primary">Community</h1>
        <p className="text-text-secondary text-sm">Connect with Moms Who Trade</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          {/* Telegram Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-card shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#0088CC] rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Free Telegram Community</h2>
                <p className="text-text-secondary text-sm">50+ moms learning to trade</p>
              </div>
            </div>

            <ul className="flex flex-col gap-2 mb-5">
              {['Daily market updates', 'Trade ideas & alerts', 'Ask Mel anything', 'Beginner-friendly chat'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-accent-success">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="https://t.me/+0_HXQIvTI5Y2YTQ0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-white text-text-primary rounded-pill px-6 py-4 font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[52px] border border-gray-100"
            >
              Join Free Telegram
              <ExternalLink size={16} className="text-text-tertiary" />
            </a>
          </motion.div>

          {/* Coaching Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-card shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent-primary rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">1:1 Coaching with Mel</h2>
                <p className="text-text-secondary text-sm">Personalized trading mentorship</p>
              </div>
            </div>

            <ul className="flex flex-col gap-2 mb-5">
              {[
                'Personalized trading plan',
                'Portfolio review & feedback',
                'Weekly progress check-ins',
                'Strategy development',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-accent-success">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="https://whop.com/moms-who-trade/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-accent-primary text-white rounded-pill px-6 py-4 font-semibold shadow-sm hover:bg-accent-dark hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[52px]"
            >
              Book Now →
              <ExternalLink size={16} />
            </a>
          </motion.div>

          {/* Follow Us on Socials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-card shadow-sm p-6"
          >
            <h2 className="text-lg font-bold text-text-primary mb-4">Follow Us</h2>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.youtube.com/@moms_who_trade"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full bg-red-50 text-red-700 rounded-xl px-5 py-4 font-semibold hover:bg-red-100 transition-all"
              >
                <Youtube size={22} className="flex-shrink-0" />
                <span className="flex-1">YouTube — @moms_who_trade</span>
                <ExternalLink size={14} className="opacity-60" />
              </a>
              <a
                href="https://www.instagram.com/moms_who_trade/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full rounded-xl px-5 py-4 font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #fdf3f8 0%, #f0e8ff 100%)', color: '#9333ea' }}
              >
                <Instagram size={22} className="flex-shrink-0" />
                <span className="flex-1">Instagram — @moms_who_trade</span>
                <ExternalLink size={14} className="opacity-60" />
              </a>
            </div>
          </motion.div>

          {/* Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-dim rounded-card p-5 text-center border-2 border-dashed border-gray-200"
          >
            <MessageCircle size={28} className="text-text-tertiary mx-auto mb-2" />
            <h3 className="font-semibold text-text-secondary mb-1">In-app chat coming soon</h3>
            <p className="text-xs text-text-tertiary">Connect with the community directly in the app</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
