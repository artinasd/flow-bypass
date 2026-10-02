import { useEffect, useMemo, useState, useCallback } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ProductCard } from './components/ProductCard'
import { Features, FAQ } from './components/Features'
import { OrderModal } from './components/OrderModal'
import { Footer } from './components/Footer'
import './App.css'

/*
  Add future products by copying an object below.
  The storefront, card layout, image treatment and order flow are generated from this data.
*/
const products = [
  {
    id: 'google-ai-pro-family',
    eyebrow: 'GOOGLE AI PRO',
    category: 'AI SUBSCRIPTION',
    name: 'اشتراک خانوادگی',
    price: 250000,
    description: 'دسترسی حرفه‌ای به اکوسیستم هوش مصنوعی گوگل، بدون Google Flow.',
    featured: false,
    badge: 'اقتصادی',
    features: [
      'دسترسی کامل به Gemini و مدل‌های پیشرفته',
      'تولید تصویر، ویدیو و موسیقی',
      'Jules Coding Agent',
      'NotebookLM',
      'Anti Gravity',
      '۵ ترابایت فضای ابری',
      'بدون Google Flow',
    ],
  },
  {
    id: 'google-ai-pro-exclusive',
    eyebrow: 'GOOGLE AI PRO',
    category: 'AI SUBSCRIPTION',
    name: 'فعال‌سازی اختصاصی',
    price: 600000,
    description: 'فعال‌سازی اختصاصی با Google Flow و اعتبار ماهانه برای تجربه کامل‌تر.',
    featured: true,
    badge: 'پیشنهاد ویژه',
    features: [
      'تمام امکانات Google AI Pro',
      'دسترسی به Google Flow',
      '۱۰۰۰ اعتبار ماهانه',
      'دسترسی کامل به Gemini و مدل‌های پیشرفته',
      'تولید تصویر، ویدیو و موسیقی',
      'Jules Coding Agent',
      'NotebookLM و Anti Gravity',
      '۵ ترابایت فضای ابری',
    ],
  },
]

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', notes: '' })
  const [status, setStatus] = useState('idle')

  const total = useMemo(() => {
    return selectedProduct ? selectedProduct.price * quantity : 0
  }, [selectedProduct, quantity])

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [selectedProduct])

  const closeOrder = useCallback(() => {
    if (status === 'sending') return
    setSelectedProduct(null)
    setStatus('idle')
  }, [status])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedProduct) closeOrder()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedProduct, closeOrder])

  const openOrder = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setStatus('idle')
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const submitOrder = async (e) => {
    e.preventDefault()
    if (!selectedProduct || status === 'sending') return

    setStatus('sending')
    try {
      const payload = {
        customer: { ...form },
        items: [{ productId: selectedProduct.id, quantity }],
      }

      const res = await fetch('/api/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to send')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="site-shell">
      <Header />

      <main>
        <Hero />

        <section className="products-section" id="products">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">محصولات / {String(products.length).padStart(2, '۰')}</span>
              <h2 className="section-title">ابزار مناسب خودت را انتخاب کن.</h2>
              <p className="section-desc">محصولات را مقایسه کنید. ثبت درخواست بسیار ساده و سریع است.</p>
            </div>

            <div className="product-grid">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onOrder={openOrder}
                />
              ))}
            </div>
          </div>
        </section>

        <Features />
        <FAQ />
      </main>

      <Footer />

      <OrderModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={closeOrder}
        status={status}
        form={form}
        updateField={updateField}
        quantity={quantity}
        setQuantity={setQuantity}
        submitOrder={submitOrder}
        total={total}
      />
    </div>
  )
}

export default App
