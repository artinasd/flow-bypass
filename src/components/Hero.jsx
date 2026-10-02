import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-container">

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <div className="hero-kicker">
            <span className="kicker-dot" aria-hidden="true" />
            فروشگاه ابزارهای حرفه‌ای AI
          </div>

          <h1 className="hero-title">
            ابزارهای درست،<br />
            <span className="hero-title-highlight">برای کارهای بزرگ.</span>
          </h1>

          <p className="hero-description">
            دسترسی به قدرتمندترین مدل‌های هوش مصنوعی با اشتراک‌های اختصاصی و
            خانوادگی Google AI Pro. ساده انتخاب کنید، حرفه‌ای کار کنید.
          </p>

          <div className="hero-actions">
            <a href="#products" className="btn btn-primary">
              مشاهده اشتراک‌ها <ArrowLeft size={18} />
            </a>
            <a href="#why-us" className="btn btn-secondary">
              چرا از ما خرید کنید؟
            </a>
          </div>

          <div className="hero-features">
            <span>✓ سفارش سریع</span>
            <span>✓ تحویل و پشتیبانی مستقیم</span>
            <span>✓ مناسب کسب‌وکارها</span>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          aria-hidden="true"
        >
          {/* A structural, technical visualization replacing the floating orbs */}
          <div className="visual-grid-bg" />

          <div className="visual-card">
            <div className="visual-card-header">
              <span className="visual-card-badge">PRO LICENSE</span>
              <div className="visual-status">
                <span className="status-dot"></span>
                ACTIVE
              </div>
            </div>

            <div className="visual-card-body">
              <div className="visual-metric">
                <span className="metric-label">Compute Target</span>
                <span className="metric-value">Gemini Advanced</span>
              </div>
              <div className="visual-metric">
                <span className="metric-label">Storage Capacity</span>
                <span className="metric-value">2TB Cloud Storage</span>
              </div>
              <div className="visual-metric">
                <span className="metric-label">Developer Access</span>
                <span className="metric-value">Jules / Flow Enabled</span>
              </div>
            </div>

            <div className="visual-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '85%' }} />
              </div>
              <div className="progress-labels">
                <span>API Usage</span>
                <span>85%</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
