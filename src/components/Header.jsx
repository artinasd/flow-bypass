import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export function Header() {
  return (
    <motion.header
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container header-container">
        <a href="/" className="logo">
          <div className="logo-mark" aria-hidden="true" />
          <span className="logo-text fa-num">استور</span>
        </a>

        <nav className="header-nav">
          <a href="#products" className="nav-link">پلتفرم</a>
          <a href="#features" className="nav-link">داستان محصول</a>
        </nav>

        <div className="header-actions">
          <a href="#products" className="header-cta">
            دریافت دسترسی <ArrowLeft size={16} strokeWidth={3} />
          </a>
        </div>
      </div>
    </motion.header>
  )
}
