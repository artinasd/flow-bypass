import { motion } from 'framer-motion'
import { Check, ArrowLeft } from 'lucide-react'

export function ProductCard({ product, index, onOrder }) {
  const isFeatured = product.featured

  // Helper to format price natively
  const formatPrice = (num) => new Intl.NumberFormat('fa-IR').format(num)

  return (
    <motion.article
      className={`product-card ${isFeatured ? 'product-card-featured' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
    >
      <div className="product-card-header">
        <div className="product-meta">
          <span className="product-eyebrow">{product.eyebrow}</span>
          <span className="product-category">{product.category}</span>
        </div>

        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
      </div>

      <div className="product-card-body">
        <div className="product-price">
          <span className="price-amount">{formatPrice(product.price)}</span>
          <span className="price-currency">تومان</span>
        </div>

        <ul className="product-features">
          {product.features.map((feature, i) => (
            <li key={i} className="feature-item">
              <Check className="feature-icon" size={16} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="product-card-footer">
        <button
          className={`btn ${isFeatured ? 'btn-primary' : 'btn-outline'} btn-full`}
          onClick={() => onOrder(product)}
        >
          سفارش این اشتراک <ArrowLeft size={18} />
        </button>
      </div>

      {product.badge && (
        <div className="product-badge">{product.badge}</div>
      )}
    </motion.article>
  )
}
