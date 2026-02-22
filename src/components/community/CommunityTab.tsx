import { useState } from 'react';
import { ExternalLink, MessageCircle, Youtube, Instagram, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { WhopCheckoutEmbed } from '@whop/checkout/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

// ─── Product definitions ────────────────────────────────────────────────────

const PLAN_WORKSHOP = 'plan_NDWT8LrloUb7h';
const PLAN_CALL     = 'plan_MEYR5hBmnpmtn';

// TODO: Replace with the real WhatsApp invite link from Mel
const WORKSHOP_WHATSAPP_LINK = 'https://chat.whatsapp.com/REPLACE_WITH_REAL_LINK';

const PRODUCTS = [
  {
    planId: PLAN_CALL,
    title: '1:1 Trading Kickstart Call',
    subtitle: 'with Mel — 60 minutes',
    price: '$97',
    badge: 'One-time',
    learnMoreUrl: 'https://whop.com/moms-who-trade/1-1-trading-kickstart-call-with-mel/',
    accent: '#7C3AED',
    // Drop your image in public/products/call-kickstart.jpg (any JPG/PNG/WebP, ~1200×675px recommended)
    image: '/products/call-kickstart.jpg',
    imageFallbackGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    emoji: '📞',
    bullets: [
      '60-min private call with Mel',
      'Your personalized trading plan',
      'Chart analysis & strategy deep-dive',
      'Recording sent after the call',
    ],
    cta: 'Book My Call',
  },
  {
    planId: PLAN_WORKSHOP,
    title: 'First $500 in 30 Days',
    subtitle: 'Foundation Workshop',
    price: '$127',
    badge: 'Workshop',
    learnMoreUrl: 'https://whop.com/moms-who-trade/first-500-in-30-days-workshop/',
    accent: '#059669',
    // Drop your image in public/products/workshop-500.jpg (any JPG/PNG/WebP, ~1200×675px recommended)
    image: '/products/workshop-500.jpg',
    imageFallbackGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    emoji: '🚀',
    bullets: [
      'Step-by-step beginner curriculum',
      'Live workshop sessions with Mel',
      'Clear action plan to your first $500',
      'Lifetime access to all recordings',
    ],
    cta: 'Join the Workshop',
  },
] as const;

// ─── Success modal content per product ──────────────────────────────────────

const SUCCESS_CONTENT = {
  [PLAN_CALL]: {
    heading: 'Call booked. See you soon.',
    body: 'Check your email for your Zoom link and prep notes from Mel. Come with your questions ready.',
    primaryLabel: 'Got it',
    primaryAction: 'close' as const,
  },
  [PLAN_WORKSHOP]: {
    heading: "You're in. Let's get to work.",
    body: "Check your email for your Whop login — your modules are waiting. Join the WhatsApp group below to meet your cohort and get Mel's first message.",
    primaryLabel: 'Join WhatsApp Group',
    primaryAction: 'whatsapp' as const,
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CommunityTab() {
  const { user } = useAuth();
  const [activePlanId, setActivePlanId]   = useState<string | null>(null);
  const [successPlanId, setSuccessPlanId] = useState<string | null>(null);
  const [imgErrors, setImgErrors]         = useState<Record<string, boolean>>({});

  const activeProduct  = PRODUCTS.find(p => p.planId === activePlanId);
  const successContent = successPlanId ? SUCCESS_CONTENT[successPlanId as keyof typeof SUCCESS_CONTENT] : null;

  // Called by WhopCheckoutEmbed when payment completes
  async function handlePurchaseComplete(plan_id: string) {
    // Close checkout sheet, open success modal
    setActivePlanId(null);
    setSuccessPlanId(plan_id);

    if (!user) return;

    // ── Firestore update ──────────────────────────────────────────────────
    const isWorkshop = plan_id === PLAN_WORKSHOP;
    const firestoreData = isWorkshop
      ? { isPaidUser: true, purchasedWorkshop: true, workshopPurchaseDate: serverTimestamp() }
      : { isPaidUser: true, purchasedCall: true, callPurchaseDate: serverTimestamp() };

    setDoc(doc(db, 'users', user.uid), firestoreData, { merge: true }).catch(() => {
      // Silent — don't block user
    });

    // ── Ghost Admin label sync (via Cloud Function) ───────────────────────
    // NOTE: This requires the 'addGhostLabel' Cloud Function to be deployed.
    // See functions/ folder for setup instructions.
    const label = isWorkshop ? 'workshop-buyer' : 'call-buyer';
    try {
      const functions = getFunctions(app);
      const addGhostLabel = httpsCallable(functions, 'addGhostLabel');
      addGhostLabel({ email: user.email, label, name: user.displayName ?? undefined });
    } catch {
      // Silent — don't block user
    }
  }

  function closeSuccessModal() {
    setSuccessPlanId(null);
    toast.success('Welcome aboard! Check your email for next steps.');
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="bg-white px-4 pb-4 sticky top-0 z-30 shadow-sm page-header">
        <h1 className="text-xl font-bold text-text-primary">Level Up</h1>
        <p className="text-text-secondary text-sm">Grow with Moms Who Trade</p>
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
              {['Regular market updates', 'Trade ideas & alerts', 'Reply to Mel on posts', 'Beginner-friendly chat'].map(item => (
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

          {/* Whop Product Cards */}
          {PRODUCTS.map((product, i) => {
            const imageErrored = imgErrors[product.planId];
            return (
              <motion.div
                key={product.planId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white rounded-card shadow-sm overflow-hidden"
              >
                {/* Banner image — 16:9, falls back to gradient + emoji */}
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  {!imageErrored ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={() => setImgErrors(prev => ({ ...prev, [product.planId]: true }))}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: product.imageFallbackGradient }}
                    >
                      <span className="text-7xl">{product.emoji}</span>
                    </div>
                  )}
                  {/* Price pill overlaid on image */}
                  <div
                    className="absolute top-3 right-3 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
                    style={{ background: product.accent }}
                  >
                    {product.price}
                  </div>
                </div>

                {/* Card content */}
                <div className="px-5 pt-4 pb-5">
                  {/* Badge + Whop link row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
                      style={{ background: product.accent }}
                    >
                      {product.badge}
                    </span>
                    <a
                      href={product.learnMoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 hover:opacity-70 transition-opacity"
                      style={{ borderColor: product.accent, color: product.accent }}
                    >
                      View on Whop
                      <ExternalLink size={10} />
                    </a>
                  </div>

                  <h2 className="text-lg font-bold text-text-primary leading-tight">{product.title}</h2>
                  <p className="text-text-secondary text-sm mt-0.5 mb-4">{product.subtitle}</p>

                  <ul className="flex flex-col gap-2 mb-5">
                    {product.bullets.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="font-bold flex-shrink-0 mt-px" style={{ color: product.accent }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setActivePlanId(product.planId)}
                    className="flex items-center justify-center w-full text-white rounded-pill px-6 py-4 font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[52px]"
                    style={{ background: product.accent }}
                  >
                    {product.cta} →
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Follow Us on Socials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
            transition={{ delay: 0.25 }}
            className="bg-surface-dim rounded-card p-5 text-center border-2 border-dashed border-gray-200"
          >
            <MessageCircle size={28} className="text-text-tertiary mx-auto mb-2" />
            <h3 className="font-semibold text-text-secondary mb-1">In-app chat coming soon</h3>
            <p className="text-xs text-text-tertiary">Connect with the community directly in the app</p>
          </motion.div>
        </div>
      </div>

      {/* ── Checkout modal (slide-up sheet) ───────────────────────────────────── */}
      <AnimatePresence>
        {activePlanId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/60"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="flex flex-col bg-white rounded-t-2xl mt-auto"
              style={{ height: '92dvh' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <p className="font-bold text-text-primary text-base leading-tight">
                    {activeProduct?.title}
                  </p>
                  <p className="text-text-tertiary text-xs">{activeProduct?.subtitle}</p>
                </div>
                <button
                  onClick={() => setActivePlanId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <WhopCheckoutEmbed
                  planId={activePlanId}
                  theme="light"
                  skipRedirect
                  onComplete={handlePurchaseComplete}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {successPlanId && successContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={30} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary mb-2">{successContent.heading}</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{successContent.body}</p>
                </div>
                <div className="w-full flex flex-col gap-3 mt-1">
                  {successContent.primaryAction === 'whatsapp' ? (
                    <>
                      <a
                        href={WORKSHOP_WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeSuccessModal}
                        className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white rounded-pill px-6 py-4 font-semibold min-h-[52px]"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Join WhatsApp Group
                      </a>
                      <button
                        onClick={closeSuccessModal}
                        className="text-text-secondary text-sm font-medium py-2"
                      >
                        Go to my dashboard
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={closeSuccessModal}
                      className="flex items-center justify-center w-full bg-accent-primary text-white rounded-pill px-6 py-4 font-semibold min-h-[52px]"
                    >
                      {successContent.primaryLabel}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
