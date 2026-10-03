import { useEffect, useMemo, useState, useCallback } from 'react'
import { ArrowDownLeft, ArrowUpLeft, Check, ChevronDown, Minus, Plus, X, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'
import './App.css'

const products = [
  {
    id: 'google-ai-pro-family',
    provider: 'Google AI Pro',
    providerMark: 'G',
    category: 'اشتراک هوش مصنوعی',
    name: 'اشتراک خانوادگی',
    price: 250000,
    description: 'راهی اقتصادی برای ورود به اکوسیستم حرفه‌ای Google AI، بدون Google Flow.',
    featured: false,
    badge: 'اقتصادی',
    accent: 'google',
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
    provider: 'Google AI Pro',
    providerMark: 'G',
    category: 'اشتراک هوش مصنوعی',
    name: 'فعال‌سازی اختصاصی',
    price: 600000,
    description: 'تجربه کامل‌تر Google AI Pro با Flow و اعتبار ماهانه برای تولید محتوا.',
    featured: true,
    badge: 'پیشنهاد ویژه',
    accent: 'google',
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
  {
    id: 'chatgpt-plus-full-warranty',
    provider: 'ChatGPT Plus',
    providerMark: 'C',
    category: 'اشتراک هوش مصنوعی',
    name: 'پلاس با ضمانت کامل',
    price: 11,
    currency: 'USD',
    description: 'اشتراک ChatGPT Plus با ضمانت کامل برای خیال راحت‌تر در استفاده.',
    featured: true,
    badge: 'ضمانت کامل',
    accent: 'chatgpt',
    features: ['دسترسی به ChatGPT Plus', 'ضمانت کامل', 'دسترسی به قابلیت‌های حرفه‌ای ChatGPT', 'مناسب استفاده شخصی و حرفه‌ای'],
  },
  {
    id: 'chatgpt-plus-7-day-warranty',
    provider: 'ChatGPT Plus',
    providerMark: 'C',
    category: 'اشتراک هوش مصنوعی',
    name: 'پلاس با ضمانت ۷ روزه',
    price: 8,
    currency: 'USD',
    description: 'نسخه اقتصادی ChatGPT Plus با ضمانت ۷ روزه.',
    featured: false,
    badge: 'اقتصادی',
    accent: 'chatgpt',
    features: ['دسترسی به ChatGPT Plus', 'ضمانت ۷ روزه', 'دسترسی به قابلیت‌های حرفه‌ای ChatGPT', 'گزینه اقتصادی‌تر'],
  },
]

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value)
const formatMoney = (product) => product?.currency === 'USD' ? '$' + product.price : `${formatPrice(product?.price)} تومان`
const formatTotal = (product, total) => product?.currency === 'USD' ? '$' + total : `${formatPrice(total)} تومان`

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', notes: '' })
  const [status, setStatus] = useState('idle')

  const total = useMemo(
    () => selectedProduct ? selectedProduct.price * quantity : 0,
    [selectedProduct, quantity],
  )

  const closeOrder = useCallback(() => {
    if (status === 'sending') return
    setSelectedProduct(null)
    setStatus('idle')
  }, [status])

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedProduct])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && selectedProduct) closeOrder()
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
    setForm((previous) => ({ ...previous, [field]: value }))
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
          customer: { ...form },
          items: [{ productId: selectedProduct.id, quantity }],
        }),
      })

      if (!response.ok) throw new Error('Failed to send')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="brand" aria-label="AI.Store">
            <span className="brand-symbol" aria-hidden="true"><Sparkles size={16} /></span>
            <span>AI.Store</span>
          </a>

          <nav className="desktop-nav" aria-label="ناوبری اصلی">
            <a href="#products">محصولات</a>
            <a href="#experience">چرا اینجا؟</a>
            <a href="#faq">سوالات</a>
          </nav>

          <a className="header-action" href="#products">
            مشاهده محصولات
            <ArrowDownLeft size={17} />
          </a>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow-line">
                <span className="eyebrow-dot" />
                <span>دسترسی به ابزارهای هوش مصنوعی</span>
              </div>

              <h1>
                ابزارهای قدرتمند.
                <br />
                <em>انتخاب ساده.</em>
              </h1>

              <p>
                اشتراک‌ها و دسترسی‌های حرفه‌ای هوش مصنوعی، با انتخابی روشن و فرایندی ساده.
                یک مقصد برای ابزارهایی که واقعاً به کارتان می‌آیند.
              </p>

              <div className="hero-actions">
                <a href="#products" className="button button-dark">
                  دیدن محصولات
                  <ArrowDownLeft size={18} />
                </a>
                <a href="#experience" className="text-action">
                  چطور کار می‌کند؟
                  <ArrowLeft size={17} />
                </a>
              </div>
            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="hero-art-grid" />
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-orbit orbit-three" />
              <div className="hero-core">
                <span className="hero-core-small">INTELLIGENCE</span>
                <strong>AI</strong>
                <span className="hero-core-small">ACCESS / 01</span>
              </div>
              <div className="hero-node hero-node-google">GOOGLE AI</div>
              <div className="hero-node hero-node-chatgpt">CHATGPT</div>
              <div className="hero-node hero-node-future">NEXT / SOON</div>
              <span className="hero-coordinate top">01 / 04</span>
              <span className="hero-coordinate bottom">DIGITAL TOOLS</span>
            </div>
          </div>

          <div className="hero-marquee" aria-hidden="true">
            <div className="marquee-track">
              <span>AI TOOLS</span><i>✦</i><span>SMART ACCESS</span><i>✦</i>
              <span>AI TOOLS</span><i>✦</i><span>SMART ACCESS</span><i>✦</i>
            </div>
          </div>
        </section>

        <section className="manifesto-section" id="experience">
          <div className="container manifesto-grid">
            <span className="section-index">01</span>
            <div>
              <p className="section-label">رویکرد ما</p>
              <h2>هر ابزار، برای یک نیاز.<br /><span>نه یک انتخاب تصادفی.</span></h2>
            </div>
            <p className="manifesto-copy">
              بازار ابزارهای هوش مصنوعی شلوغ شده است. اینجا قرار نیست همه‌چیز را بفروشیم؛
              قرار است دسترسی به سرویس‌های درست را ساده کنیم، تفاوت‌ها را روشن نشان دهیم
              و سفارش را بدون پیچیدگی اضافه جلو ببریم.
            </p>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="container">
            <div className="section-intro">
              <div>
                <span className="section-label">محصولات فعلی</span>
                <h2>چیزی را انتخاب کنید<br />که به کارتان می‌آید.</h2>
              </div>
              <span className="section-index">02</span>
            </div>

            <div className="product-list">
              {products.map((product, index) => (
                <ProductShowcase
                  key={product.id}
                  product={product}
                  index={index}
                  onOrder={openOrder}
                />
              ))}
            </div>
        </section>

        <section className="principles-section">
          <div className="container">
            <div className="section-intro principles-intro">
              <div>
                <span className="section-label">فرایند</span>
                <h2>ساده، روشن،<br />بدون حاشیه.</h2>
              </div>
              <span className="section-index">03</span>
            </div>

            <div className="process-map">
              <div className="process-track" aria-hidden="true" />
              <article>
                <div className="process-marker"><span>01</span></div>
                <div className="process-icon"><ShieldCheck size={22} /></div>
                <h3>انتخاب روشن</h3>
                <p>ویژگی‌ها و قیمت هر محصول را قبل از ثبت درخواست می‌بینید.</p>
                <span className="process-code">SELECT / 01</span>
              </article>
              <article>
                <div className="process-marker"><span>02</span></div>
                <div className="process-icon"><ArrowUpLeft size={22} /></div>
                <h3>ثبت درخواست</h3>
                <p>اطلاعات تماس و تعداد موردنیاز را در چند مرحله کوتاه ثبت می‌کنید.</p>
                <span className="process-code">REQUEST / 02</span>
              </article>
              <article>
                <div className="process-marker"><span>03</span></div>
                <div className="process-icon"><Check size={22} /></div>
                <h3>هماهنگی و فعال‌سازی</h3>
                <p>درخواست شما دریافت می‌شود و ادامه فرایند برایتان هماهنگ خواهد شد.</p>
                <span className="process-code">ACTIVATE / 03</span>
              </article>
            </div>
          </div>
        </section>

        <section className="future-section">
          <div className="container future-grid">
            <span className="section-index">04</span>
            <div>
              <span className="section-label">در حال گسترش</span>
              <h2>یک فروشگاه.<br /><span>چند اکوسیستم.</span></h2>
              <p>
                این فروشگاه برای یک سرویس ساخته نشده است. با گسترش کاتالوگ،
                ابزارهای مختلف هوش مصنوعی در کنار هم قرار می‌گیرند تا انتخاب بر اساس
                نیاز انجام شود، نه بر اساس یک برند خاص.
              </p>
              <div className="future-names" aria-label="اکوسیستم‌های هدف">
                <span><b>01</b>Google AI</span>
                <span><b>02</b>ChatGPT</span>
                <span><b>03</b>Perplexity</span>
                <span><b>04</b>+ more</span>
              </div>
            </div>
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="container faq-grid">
            <div>
              <span className="section-label">شفافیت</span>
              <h2>سوال‌های<br />مهم، جواب‌های<br /><span>روشن.</span></h2>
            </div>
            <div className="faq-list">
              <FaqItem question="آیا پرداخت به‌صورت آنلاین انجام می‌شود؟">
                خیر. این سایت برای انتخاب محصول و ثبت درخواست سفارش طراحی شده است. پس از ثبت موفق، برای هماهنگی پرداخت و فعال‌سازی با شما در ارتباط خواهیم بود.
              </FaqItem>
              <FaqItem question="بعد از ثبت سفارش چه اتفاقی می‌افتد؟">
                درخواست شما دریافت می‌شود و اطلاعات لازم برای ادامه فرایند با شما هماهنگ خواهد شد.
              </FaqItem>
              <FaqItem question="آیا محصولات دیگری هم اضافه می‌شوند؟">
                بله. ساختار فروشگاه برای چند سرویس و اکوسیستم مختلف طراحی شده و کاتالوگ به مرور گسترش پیدا می‌کند.
              </FaqItem>
              <FaqItem question="اگر درباره انتخاب محصول مطمئن نباشم چه؟">
                می‌توانید هنگام ثبت درخواست توضیحات خود را بنویسید تا قبل از ادامه فرایند، انتخاب مناسب‌تر برایتان بررسی شود.
              </FaqItem>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container final-cta-inner">
            <span className="section-label">شروع کنید</span>
            <h2>ابزار بعدی<br /><em>می‌تواند همین‌جا باشد.</em></h2>
            <a href="#products" className="button button-light">
              مشاهده محصولات
              <ArrowDownLeft size={18} />
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-top">
          <a href="/" className="brand"><span className="brand-symbol"><Sparkles size={15} /></span><span>AI.Store</span></a>
          <div className="footer-note">فروشگاه دسترسی‌های حرفه‌ای هوش مصنوعی</div>
          <a href="#products" className="footer-link">محصولات <ArrowLeft size={15} /></a>
        </div>
        <div className="container footer-bottom">
          <span>© ۱۴۰۵ AI.Store</span>
          <span>ساخته‌شده برای انتخاب بهتر.</span>
        </div>
      </footer>

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

function ProductShowcase({ product, index, onOrder }) {
  return (
    <article className={'product-showcase product-showcase-' + index}>
      <div className={'product-visual product-visual-' + product.accent}>
        <div className="product-visual-glow" aria-hidden="true" />
        <div className="product-visual-top">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span>{product.category}</span>
        </div>
        <div className="product-brand-mark">{product.providerMark}</div>
        <div className="product-visual-name">{product.provider}</div>
        <div className="product-visual-line" />
        <span className="product-visual-caption">{product.featured ? 'FULL ACCESS / 01' : 'ESSENTIAL ACCESS / 01'}</span>
        <div className="visual-stack" aria-hidden="true">
          {product.accent === 'google' ? (
            <><span>GEMINI</span><span>FLOW</span><span>JULES</span><span>NOTEBOOKLM</span></>
          ) : (
            <><span>CHAT</span><span>REASON</span><span>CREATE</span><span>PLUS</span></>
          )}
        </div>
      </div>
      <div className="product-info">
        <div className="product-meta"><span>{product.provider}</span><span>{product.badge}</span></div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="feature-rows">
          {product.features.slice(0, 6).map((feature, featureIndex) => (
            <div key={feature}>
              <span className="feature-number">{String(featureIndex + 1).padStart(2, '0')}</span>
              <Check size={15} /><span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="product-buy">
          <div><span>قیمت / واحد</span><strong>{formatMoney(product)}</strong></div>
          <button className="button button-dark" onClick={() => onOrder(product)}>
            {product.featured ? 'فعال‌سازی' : 'ثبت سفارش'}<ArrowLeft size={17} />
          </button>
        </div>
        <div className="product-footnote"><span>DIRECT REQUEST</span><span>{String(index + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}</span></div>
      </div>
    </article>
  )
}

function FaqItem({ question, children }) {
  return (
    <details className="faq-item">
      <summary><span>{question}</span><ChevronDown size={20} /></summary>
      <p>{children}</p>
    </details>
  )
}

function selectedCurrency(product, total) {
  return formatTotal(product, total)
}

function OrderModal({ product, isOpen, onClose, status, form, updateField, quantity, setQuantity, submitOrder, total }) {
  if (!isOpen) return null

  return (
    <div className="order-backdrop" onMouseDown={onClose}>
      <div className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="order-close" onClick={onClose} aria-label="بستن"><X size={20} /></button>

        {status === 'success' ? (
          <div className="order-success">
            <span className="success-mark"><Check size={28} /></span>
            <span className="section-label">درخواست دریافت شد</span>
            <h2>ثبت سفارش<br />موفق بود.</h2>
            <p>اطلاعات شما با موفقیت ارسال شد. ادامه فرایند برای هماهنگی پرداخت و فعال‌سازی انجام خواهد شد.</p>
            <button className="button button-dark" onClick={onClose}>بازگشت</button>
          </div>
        ) : (
          <>
            <div className="order-heading">
              <span className="section-label">ثبت درخواست</span>
              <h2 id="order-title">{product?.name}</h2>
              <p>{product?.provider}</p>
            </div>

            <div className="order-summary">
              <div>
                <span>قیمت واحد</span>
                <strong>{formatMoney(product)}</strong>
              </div>
              <div className="quantity-selector">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="کاهش تعداد"><Minus size={16} /></button>
                <span>{formatPrice(quantity)}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(99, value + 1))} aria-label="افزایش تعداد"><Plus size={16} /></button>
              </div>
            </div>

            <form className="order-form" onSubmit={submitOrder}>
              <div className="form-two">
                <label>نام و نام خانوادگی *
                  <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required autoComplete="name" />
                </label>
                <label>شماره تماس *
                  <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required type="tel" dir="ltr" autoComplete="tel" />
                </label>
              </div>
              <label>سازمان یا کسب‌وکار <span>اختیاری</span>
                <input value={form.company} onChange={(event) => updateField('company', event.target.value)} autoComplete="organization" />
              </label>
              <label>ایمیل <span>اختیاری</span>
                <input value={form.email} onChange={(event) => updateField('email', event.target.value)} type="email" dir="ltr" autoComplete="email" />
              </label>
              <label>توضیحات <span>اختیاری</span>
                <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} rows="3" />
              </label>

              {status === 'error' && <div className="order-error" role="alert">ارسال سفارش انجام نشد. لطفاً دوباره تلاش کنید.</div>}

              <div className="order-submit">
                <div><span>مجموع</span><strong>{selectedCurrency(product, total)}</strong></div>
                <button className="button button-dark" disabled={status === 'sending'} type="submit">
                  {status === 'sending' ? 'در حال ارسال...' : 'تأیید و ارسال'}
                  {status !== 'sending' && <ArrowLeft size={17} />}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default App
