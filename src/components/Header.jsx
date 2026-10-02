import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'

export function Header() {
  return (
    <motion.header
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container header-container">
        <a href="/" className="logo">
          <div className="logo-mark" aria-hidden="true" />
          <span className="logo-text">AI.Store</span>
        </a>

        <nav className="header-nav">
          <a href="#products" className="nav-link">محصولات</a>
          <a href="#why-us" className="nav-link">ویژگی‌ها</a>
          <a href="#faq" className="nav-link">پاسخ به سوالات</a>
        </nav>

        <div className="header-actions">
          <a href="#products" className="header-cta">
            <ShoppingBag size={16} />
            شروع کنید
          </a>
        </div>
      </div>
    </motion.header>
  )
}
