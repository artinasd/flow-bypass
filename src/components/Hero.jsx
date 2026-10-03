import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-container">

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <div className="hero-kicker">
            GOOGLE AI PRO / ECOSYSTEM
          </div>

          <h1 className="hero-title">
            هوشمندی<br />
            <span className="hero-title-highlight">در مقیاس بزرگ.</span>
          </h1>

          <p className="hero-description">
            دسترسی بدون محدودیت به پیشرفته‌ترین مدل‌های هوش مصنوعی.
            طراحی شده برای تیم‌ها و افرادی که کارهای بزرگ انجام می‌دهند.
          </p>

          <div className="hero-actions">
            <a href="#products" className="btn btn-primary btn-full" style={{ width: 'auto' }}>
              مشاهده لایسنس‌ها <ArrowLeft size={18} strokeWidth={2.5} />
            </a>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          aria-hidden="true"
        >
          <div className="hero-visual-abstract">
            <div className="abstract-shape-1" />
            <div className="abstract-shape-2" />

            <div className="abstract-core">
              <div className="abstract-text">PRO.</div>
              <div className="abstract-sub">Environment Active</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
