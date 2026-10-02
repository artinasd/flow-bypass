import { useEffect, useMemo, useState } from 'react'
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
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'نمای انتزاعی و آینده‌نگر از فناوری هوش مصنوعی',
    imageLabel: 'AI PRO / FAMILY',
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
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'نمای نزدیک از یک برد الکترونیکی پیشرفته',
    imageLabel: 'AI PRO / EXCLUSIVE',
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

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value)

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', notes: '' })
  const [status, setStatus] = useState('idle')

  const total = useMemo(
    () => (selectedProduct ? selectedProduct.price * quantity : 0),
    [selectedProduct, quantity],
  )

  useEffect(() => {
    if (!selectedProduct) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && status !== 'sending') setSelectedProduct(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedProduct, status])

  const openOrder = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setForm({ name: '', company: '', phone: '', email: '', notes: '' })
    setStatus('idle')
  }

  const closeOrder = () => {
    if (status !== 'sending') setSelectedProduct(null)
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    if (!selectedProduct || status === 'sending') return

    setStatus('sending')

    try {
      const response = await fetch('/api/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: [{ productId: selectedProduct.id, quantity }],
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'ارسال سفارش ناموفق بود.')

      setStatus('success')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  return (
    <div className="site-shell">
      <header className="nav">
        <a className="brand" href="#" aria-label="صفحه اصلی">
          <span className="brand-mark">AI</span>
          <span>AI<span className="brand-dot">.</span>Store</span>
        </a>

        <nav className="nav-links" aria-label="ناوبری اصلی">
          <a href="#products">محصولات</a>
          <a href="#why-us">چرا ما؟</a>
          <a href="#faq">سؤالات متداول</a>
        </nav>

        <a className="nav-cta" href="#products">مشاهده محصولات <span>←</span></a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> اشتراک‌های حرفه‌ای هوش مصنوعی</div>
            <h1>ابزارهای هوش مصنوعی.<br /><em>برای کار جدی.</em></h1>
            <p className="hero-text">
              اشتراک‌های منتخب AI را برای استفاده شخصی و تیمی، با فرآیند سفارش ساده و پشتیبانی مستقیم دریافت کنید.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#products">انتخاب اشتراک <span>↓</span></a>
              <a className="text-button" href="#why-us">بیشتر بدانید <span>←</span></a>
            </div>
            <div className="trust-row">
              <span>✓ سفارش سریع</span>
              <span>✓ تحویل و پشتیبانی مستقیم</span>
              <span>✓ مناسب کسب‌وکارها</span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="hero-panel">
              <div className="panel-top"><span>AI / CATALOG</span><span className="live-dot">● AVAILABLE</span></div>
              <div className="panel-title">ابزارهای درست،<br /><strong>برای کارهای بزرگ.</strong></div>
              <div className="panel-grid">
                <span>Gemini</span><span>Flow</span><span>Jules</span><span>NotebookLM</span>
              </div>
              <div className="panel-line"><span>Cloud storage</span><strong>5 TB</strong></div>
            </div>
          </div>
        </section>

        <section className="section products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="section-kicker">محصولات / {String(products.length).padStart(2, '۰')}</span>
              <h2>ابزار مناسب خودت را انتخاب کن.</h2>
            </div>
            <p>محصولات را با تصویر و مشخصات مقایسه کنید. محصول جدید هم فقط با اضافه‌کردن یک آیتم به لیست بالا وارد فروشگاه می‌شود.</p>
          </div>

          <div className="product-grid">
            {products.map((product, index) => (
              <article className={`product-card ${product.featured ? 'featured' : ''}`} key={product.id}>
                <div className="product-media">
                  <img src={product.image} alt={product.imageAlt} loading={index > 1 ? 'lazy' : 'eager'} />
                  <div className="media-shade" />
                  <span className="media-index">۰{index + ۱}</span>
                  <span className="media-label">{product.imageLabel}</span>
                  {product.badge && <span className="card-badge">{product.badge}</span>}
                </div>

                <div className="product-content">
                  <div className="product-meta">
                    <span>{product.eyebrow}</span>
                    <span>{product.category}</span>
                  </div>
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>

                  <div className="price">
                    <strong>{formatPrice(product.price)}</strong>
                    <span>تومان</span>
                  </div>

                  <div className="feature-list">
                    {product.features.map((feature) => (
                      <div className="feature" key={feature}><span>✓</span>{feature}</div>
                    ))}
                  </div>

                  <button className="purchase-button" onClick={() => openOrder(product)}>
                    سفارش این اشتراک <span>←</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="why-section section" id="why-us">
          <div className="why-intro">
            <span className="section-kicker">تجربه خرید</span>
            <h2>کمتر درگیر فرایند.<br /><em>بیشتر درگیر کار.</em></h2>
          </div>
          <div className="benefit-grid">
            <div className="benefit"><span className="benefit-number">۰۱</span><h3>انتخاب ساده</h3><p>پلن موردنظر را انتخاب کنید و فقط اطلاعات ضروری سفارش را وارد کنید.</p></div>
            <div className="benefit"><span className="benefit-number">۰۲</span><h3>بررسی مستقیم</h3><p>درخواست شما مستقیماً برای تیم ما ارسال می‌شود و ادامه فرایند دستی انجام می‌شود.</p></div>
            <div className="benefit"><span className="benefit-number">۰۳</span><h3>پشتیبانی انسانی</h3><p>برای پرداخت، تحویل و سؤالات بعدی، ارتباط مستقیم با شما داریم.</p></div>
          </div>
        </section>

        <section className="faq section" id="faq">
          <div>
            <span className="section-kicker">سؤالات متداول</span>
            <h2>قبل از سفارش</h2>
          </div>
          <div className="faq-list">
            <details open><summary>آیا پرداخت به‌صورت آنلاین انجام می‌شود؟</summary><p>خیر. این سایت برای ثبت درخواست سفارش طراحی شده است. پس از ثبت، برای هماهنگی پرداخت و تحویل با شما تماس می‌گیریم.</p></details>
            <details><summary>بعد از ثبت سفارش چه اتفاقی می‌افتد؟</summary><p>اطلاعات سفارش برای ما ارسال می‌شود و پس از بررسی، جزئیات پرداخت و نحوه تحویل با شما هماهنگ خواهد شد.</p></details>
            <details><summary>آیا برای سفارش باید حساب کاربری بسازم؟</summary><p>خیر. در نسخه فعلی برای کاهش مراحل اضافه، نیازی به ساخت حساب کاربری نیست.</p></details>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>AI.Store</span>
        <span>اشتراک‌های حرفه‌ای هوش مصنوعی</span>
      </footer>

      {selectedProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeOrder}>
          <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={closeOrder} aria-label="بستن">×</button>

            {status === 'success' ? (
              <div className="success-state">
                <div className="success-icon">✓</div>
                <span className="section-kicker">درخواست دریافت شد</span>
                <h2>سفارش شما ثبت شد.</h2>
                <p>اطلاعات سفارش برای ما ارسال شد. برای هماهنگی پرداخت و تحویل، با شما تماس خواهیم گرفت.</p>
                <button className="purchase-button" onClick={closeOrder}>بازگشت به محصولات</button>
              </div>
            ) : (
              <>
                <div className="modal-heading">
                  <span className="section-kicker">ثبت سفارش</span>
                  <h2 id="order-title">{selectedProduct.name}</h2>
                  <p>{selectedProduct.description}</p>
                </div>

                <div className="order-summary">
                  <span>قیمت هر اشتراک</span>
                  <strong>{formatPrice(selectedProduct.price)} تومان</strong>
                </div>

                <form onSubmit={submitOrder}>
                  <div className="quantity-row">
                    <label htmlFor="quantity">تعداد اشتراک</label>
                    <div className="quantity-control">
                      <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="کاهش تعداد">−</button>
                      <strong id="quantity">{formatPrice(quantity)}</strong>
                      <button type="button" onClick={() => setQuantity((value) => Math.min(99, value + 1))} aria-label="افزایش تعداد">+</button>
                    </div>
                  </div>

                  <div className="form-grid">
                    <label>نام و نام خانوادگی<input value={form.name} onChange={(e) => updateField('name', e.target.value)} autoComplete="name" required /></label>
                    <label>نام کسب‌وکار <span className="optional">اختیاری</span><input value={form.company} onChange={(e) => updateField('company', e.target.value)} autoComplete="organization" /></label>
                    <label>شماره تماس<input dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} autoComplete="tel" required /></label>
                    <label>ایمیل <span className="optional">اختیاری</span><input dir="ltr" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} autoComplete="email" /></label>
                  </div>
                  <label>توضیحات یا درخواست خاص <span className="optional">اختیاری</span><textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows="3" /></label>

                  {status === 'error' && <div className="form-error" role="alert">ارسال سفارش انجام نشد. لطفاً دوباره تلاش کنید.</div>}

                  <div className="submit-row">
                    <div><span>مجموع</span><strong>{formatPrice(total)} تومان</strong></div>
                    <button className="purchase-button" type="submit" disabled={status === 'sending'}>
                      {status === 'sending' ? 'در حال ارسال…' : 'ثبت درخواست سفارش ←'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default App
