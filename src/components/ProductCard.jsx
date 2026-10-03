import { motion } from 'framer-motion'
import { Check, ArrowLeft } from 'lucide-react'

export function ProductCard({ product, index, onOrder }) {
  const isFeatured = product.featured

  return (
    <motion.article
      className="product-showcase"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
    >
      <div className="product-content">
        <span className="product-eyebrow">{product.eyebrow}</span>

        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>

        <div className="product-price-block">
          <span className="price-amount fa-num">{product.price / 1000}</span>
          <span className="price-currency">هزار تومان / اشتراک</span>
        </div>

        <div className="product-actions" style={{ marginBottom: 'var(--space-10)' }}>
          <button
            className="btn btn-primary"
            onClick={() => onOrder(product)}
            style={{ width: 'auto' }}
          >
            {isFeatured ? 'فعال‌سازی این پلن' : 'شروع سفارش'} <ArrowLeft size={18} />
          </button>
        </div>
      </div>

      <div className="product-visual">
        <div className="product-features-list">
          {product.features.map((feature, i) => (
            <div key={i} className="product-feature-item">
              <Check className="feature-check" size={20} strokeWidth={3} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.article>
  )
}
