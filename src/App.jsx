import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion'
import Lenis from 'lenis'
import { ArrowDownLeft, ArrowUpLeft, Check, ChevronDown, Minus, Plus, X, ArrowLeft, Sparkles, ShieldCheck, Copy } from 'lucide-react'
import products from './products.json'
import './App.css'
import MultiMethodProductModal from './components/MultiMethodProductModal'
import './components/MultiMethodProductModal.css'

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value)
const formatMoney = (price, currency = 'IRR') => currency === 'USD' ? '$' + price : `${formatPrice(price)} تومان`
const formatTotal = (price, currency = 'IRR') => currency === 'USD' ? `${price}` : `${formatPrice(price)} تومان`
const CART_STORAGE_KEY = 'neo-ai-cart'
const CART_TTL = 24 * 60 * 60 * 1000

const PAYMENT = { cardNumber: atob('NjIxOTg2MTg2NDk0Njc1MA=='), holder: 'شادی جهانی', bank: 'بلوبانک سامان' }
const formatCardNumber = (value) => value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
const formatCardDigits = (value) => value.replace(/\D/g, '').replace(/(.{4})/g, '$1\u00a0').trim()

export const triggerHapticAndParticles = (e, color = '#ff7ccf') => {
  if (typeof window === 'undefined') return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }

  if (!e || reducedMotion) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX || rect.left + rect.width / 2;
  const y = e.clientY || rect.top + rect.height / 2;

  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'click-particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.backgroundColor = color;
    document.body.appendChild(p);

    const angle = (Math.PI * 2 * i) / 12;
    const velocity = 40 + Math.random() * 60;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;

    p.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
    ], {
      duration: 600 + Math.random() * 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }).onfinish = () => p.remove();
  }
}

function Atmosphere() {
  const { scrollY } = useScroll();
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const bgX = useTransform(mouseX, [0, 1], ['-5%', '5%']);
  const bgY = useTransform(mouseY, [0, 1], ['-5%', '5%']);
  const scrollYTransform = useTransform(scrollY, [0, 3000], [0, 15]);
  const combinedY = useTransform(() => `calc(${bgY.get()} - ${scrollYTransform.get()}%)`);

  return (
    <>
      <svg className="noise-overlay" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
      <motion.div 
        className="ambient-mesh" 
        style={{ x: bgX, y: combinedY }} 
        aria-hidden="true"
      />
    </>
  );
}

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null) // used for OrderModal
  const [selectedMethod, setSelectedMethod] = useState(null) // selected method for OrderModal
  const [multiMethodProduct, setMultiMethodProduct] = useState(null) // used for MultiMethodProductModal
  const [cart, setCart] = useState([])
  const [cartReady, setCartReady] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', notes: '' })
  const [status, setStatus] = useState('idle')
  const [orderStage, setOrderStage] = useState('added')
  const [copiedPayment, setCopiedPayment] = useState('')

  const cartProducts = useMemo(
    () => cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const method = product?.methods?.find((m) => m.id === item.methodId) || product?.methods?.[0];
        return { ...item, product, method };
      })
      .filter((item) => item.product),
    [cart],
  )

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  )

  const total = useMemo(
    () => cartProducts.reduce((sum, item) => {
      const price = item.method ? item.method.price : (item.product.price || 0);
      return sum + price * item.quantity;
    }, 0),
    [cartProducts],
  )

  const closeOrder = useCallback(() => {
    if (status === 'sending') return
    setSelectedProduct(null)
    setSelectedMethod(null)
    setStatus('idle')
    setOrderStage('added')
    setCopiedPayment('')
  }, [status])

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || 'null')
      if (!stored || !Array.isArray(stored.items)) {
        setCart([])
        setCartReady(true)
        return
      }

      if (!stored.updatedAt || Date.now() - stored.updatedAt > CART_TTL) {
        window.localStorage.removeItem(CART_STORAGE_KEY)
        setCart([])
        setCartReady(true)
        return
      }

      const validItems = stored.items
        .filter((item) => products.some((product) => product.id === item.productId))
        .map((item) => ({ 
          productId: item.productId, 
          methodId: item.methodId,
          quantity: Math.min(99, Math.max(1, Number(item.quantity) || 1)) 
        }))

      setCart(validItems)
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      setCart([])
    } finally {
      setCartReady(true)
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
    });
    
    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      delete window.lenis;
    };
  }, [])

  useEffect(() => {
    if (!cartReady) return
    if (!cart.length) {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: cart, updatedAt: Date.now() }))
  }, [cart, cartReady])

  useEffect(() => {
    const revealItems = document.querySelectorAll('[data-reveal]')
    if (!revealItems.length) return undefined

    document.documentElement.classList.add('reveal-ready')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'))
      return () => document.documentElement.classList.remove('reveal-ready')
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px',
    })

    revealItems.forEach((item) => observer.observe(item))

    return () => {
      observer.disconnect()
      document.documentElement.classList.remove('reveal-ready')
    }
  }, [])

  useEffect(() => {
    const siteUrl = window.location.origin + '/'
    const existingCanonical = document.querySelector('link[rel="canonical"]')
    const canonical = existingCanonical || document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = siteUrl
    if (!existingCanonical) document.head.appendChild(canonical)

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': siteUrl + '#website',
          name: 'NEO AI',
          alternateName: 'NEO AI',
          description: 'فروشگاه اشتراک‌های حرفه‌ای هوش مصنوعی',
          url: siteUrl,
        },
        {
          '@type': 'Organization',
          '@id': siteUrl + '#organization',
          name: 'NEO AI',
          url: siteUrl,
          logo: siteUrl + 'favicon.svg',
        },
        {
          '@type': 'ItemList',
          '@id': siteUrl + '#products',
          name: 'اشتراک‌های حرفه‌ای هوش مصنوعی NEO AI',
          itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              name: product.name + ' — ' + product.provider,
              description: product.description,
              brand: { '@type': 'Brand', name: product.provider },
              sku: product.id,
              offers: {
                '@type': 'Offer',
                priceCurrency: product.currency === 'USD' ? 'USD' : 'IRR',
                price: String(product.currency === 'USD' ? (product.methods?.[0]?.price || 0) : (product.methods?.[0]?.price || 0) * 10),
                availability: 'https://schema.org/InStock',
              },
            },
          })),
        },
        {
          '@type': 'FAQPage',
          '@id': siteUrl + '#faq',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'آیا پرداخت به‌صورت آنلاین انجام می‌شود؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'خیر. سایت برای انتخاب محصول و ثبت درخواست سفارش طراحی شده است. پس از ثبت موفق، برای هماهنگی پرداخت و فعال‌سازی با شما در ارتباط خواهیم بود.',
              },
            },
            {
              '@type': 'Question',
              name: 'بعد از ثبت سفارش چه اتفاقی می‌افتد؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'پس از انتقال وجه، روی دکمه ثبت سفارش می‌زنید. درخواست و مبلغ برای ما ارسال می‌شود و پرداخت به‌صورت دستی بررسی خواهد شد.',
              },
            },
            {
              '@type': 'Question',
              name: 'آیا محصولات دیگری هم اضافه می‌شوند؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'بله. ساختار فروشگاه برای چند سرویس و اکوسیستم مختلف طراحی شده و کاتالوگ به مرور گسترش پیدا می‌کند.',
              },
            },
            {
              '@type': 'Question',
              name: 'اگر درباره انتخاب محصول مطمئن نباشم چه؟',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'می‌توانید هنگام ثبت درخواست توضیحات خود را بنویسید تا قبل از ادامه فرایند، انتخاب مناسب‌تر برایتان بررسی شود.',
              },
            },
          ],
        },
      ],
    }

    let script = document.getElementById('neo-ai-structured-data')
    if (!script) {
      script = document.createElement('script')
      script.id = 'neo-ai-structured-data'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(schema)

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  useEffect(() => {
    const isModalOpen = selectedProduct || multiMethodProduct;
    document.body.style.overflow = isModalOpen ? 'hidden' : ''
    
    if (window.lenis) {
      if (isModalOpen) window.lenis.stop();
      else window.lenis.start();
    }

    if (multiMethodProduct) {
      document.body.classList.add('has-open-modal')
    } else {
      document.body.classList.remove('has-open-modal')
    }
    return () => { 
      document.body.style.overflow = ''
      document.body.classList.remove('has-open-modal')
      if (window.lenis) window.lenis.start();
    }
  }, [selectedProduct, multiMethodProduct])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && selectedProduct) closeOrder()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedProduct, closeOrder])

  useEffect(() => {
    const prefetch = () => import('./components/ThreeDCard').catch(() => {});
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 1500);
    }
  }, []);

  const handleProductAction = (e, product) => {
    if (!product.methods || product.methods.length === 1) {
      // Direct order flow
      const method = product.methods ? product.methods[0] : null;
      openOrder(e, product, method);
    } else {
      // Open multi-method panel
      triggerHapticAndParticles(e, product.accent === 'google' ? '#4285f4' : '#10a37f');
      setMultiMethodProduct(product);
      if (window.dataLayer) window.dataLayer.push({ event: 'panel_open', productId: product.id });
    }
  }

  const openOrder = (e, product, method = null) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.methodId === method?.id)
      if (existing) {
        return current.map((item) => item.productId === product.id && item.methodId === method?.id
          ? { ...item, quantity: Math.min(99, item.quantity + 1) }
          : item)
      }
      return [...current, { productId: product.id, methodId: method?.id, quantity: 1 }]
    })
    setSelectedProduct(product)
    setSelectedMethod(method)
    setMultiMethodProduct(null)
    setForm({ name: '', company: '', phone: '', email: '', notes: '' })
    setStatus('idle')
    setOrderStage('added')
    setCopiedPayment('')
    
    if (product?.accent === 'google') {
      triggerHapticAndParticles(e, '#4285f4');
    } else {
      triggerHapticAndParticles(e, '#10a37f');
    }
  }

  const openCart = () => {
    const firstItem = cartProducts[0]
    if (!firstItem) return
    setSelectedProduct(firstItem.product)
    setStatus('idle')
    setOrderStage('form')
    setCopiedPayment('')
  }

  const continueShopping = () => {
    setSelectedProduct(null)
    setStatus('idle')
    setOrderStage('added')
    setCopiedPayment('')
  }

  const continueToForm = (e) => {
    triggerHapticAndParticles(e, '#8b7cff');
    setOrderStage('form')
    setStatus('idle')
  }

  const updateCartQuantity = (productId, nextQuantity) => {
    setCart((current) => current
      .map((item) => item.productId === productId
        ? { ...item, quantity: Math.min(99, Math.max(1, nextQuantity)) }
        : item)
    )
  }

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
    if (selectedProduct?.id === productId) {
      const nextItem = cartProducts.find((item) => item.product.id !== productId)
      if (nextItem) {
        setSelectedProduct(nextItem.product)
      } else {
        setSelectedProduct(null)
        setOrderStage('added')
      }
    }
  }

  const continueToPayment = (event) => {
    event.preventDefault()
    if (!cart.length || status === 'sending') return
    triggerHapticAndParticles(event, '#8b7cff');
    setOrderStage('payment')
    setStatus('idle')
    setCopiedPayment('')
  }

  const backToForm = () => {
    if (status === 'sending') return
    setOrderStage('form')
    setStatus('idle')
    setCopiedPayment('')
  }

  const copyPaymentValue = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedPayment(field)
      window.setTimeout(() => setCopiedPayment((current) => current === field ? '' : current), 1800)
    } catch {
      setCopiedPayment('')
    }
  }

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    if (!selectedProduct || status === 'sending') return
    setStatus('sending')
    triggerHapticAndParticles(event, '#8b7cff')

    try {
      const response = await fetch('/api/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { ...form },
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      })

      if (!response.ok) throw new Error('Failed to send')
      setCart([])
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="site-shell">
      <Atmosphere />
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="brand" aria-label="NEO AI">
            <span className="brand-symbol" aria-hidden="true"><Sparkles size={16} /></span>
            <span>NEO AI</span>
          </a>

          <nav className="desktop-nav" aria-label="ناوبری اصلی">
            <a href="#products">محصولات</a>
            <a href="#experience">چرا اینجا؟</a>
            <a href="#faq">سوالات</a>
          </nav>

          <button className="header-action cart-header-action" type="button" onClick={openCart} disabled={!cartCount} aria-label={cartCount ? 'باز کردن سبد خرید' : 'سبد خرید خالی'}>
            <span>سبد خرید</span>
            <span className="cart-count">{formatPrice(cartCount)}</span>
            <ArrowDownLeft size={17} />
          </button>
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
                خرید اشتراک هوش مصنوعی.
                <br />
                <em>انتخاب ساده.</em>
              </h1>

              <p>
                اشتراک‌های حرفه‌ای هوش مصنوعی مثل Google AI Pro و ChatGPT Plus را
                مقایسه کنید، ویژگی‌ها و قیمت را ببینید و درخواست سفارش خود را شفاف ثبت کنید.
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

            <div className="hero-art">
              <img
                className="hero-image"
                src="/hero.jpg"
                alt=""
                fetchPriority="high"
                decoding="async"
              />
              <div className="hero-image-overlay" aria-hidden="true" />
              <span className="hero-image-label">AI / ACCESS SYSTEM</span>
              <span className="hero-image-index">01 / 04</span>
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
          <div className="container manifesto-grid" data-reveal>
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
            <div className="section-intro" data-reveal>
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
                  onOrder={handleProductAction}
                  revealDelay={index * 70}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="seo-guide-section" id="guide">
          <div className="container seo-guide-grid" data-reveal>
            <div>
              <span className="section-label">راهنمای انتخاب</span>
              <h2>کدام اشتراک<br /><span>برای شما بهتر است؟</span></h2>
            </div>
            <div className="seo-guide-copy">
              <article>
                <h3>Google AI Pro برای کار با اکوسیستم Google</h3>
                <p>
                  اگر استفاده شما بیشتر به Gemini، تولید تصویر و ویدیو، NotebookLM، Jules
                  و سرویس‌های Google وابسته است، Google AI Pro می‌تواند انتخاب مناسب‌تری باشد.
                  NEO AI دو گزینه Google AI Pro ارائه می‌کند: اشتراک خانوادگی اقتصادی و فعال‌سازی
                  اختصاصی با Google Flow و ۱۰۰۰ اعتبار ماهانه.
                </p>
              </article>
              <article>
                <h3>ChatGPT Plus برای استفاده حرفه‌ای از ChatGPT</h3>
                <p>
                  ChatGPT Plus برای کاربرانی مناسب است که می‌خواهند از قابلیت‌های حرفه‌ای ChatGPT
                  استفاده کنند. در NEO AI دو گزینه با شرایط ضمانت متفاوت ارائه شده تا بتوانید
                  بین ضمانت کامل و گزینه اقتصادی‌تر با ضمانت ۷ روزه انتخاب کنید.
                </p>
              </article>
              <article>
                <h3>قبل از خرید به چه چیزهایی توجه کنیم؟</h3>
                <p>
                  فقط قیمت را مقایسه نکنید؛ نوع دسترسی، امکانات واقعی هر طرح، شرایط ضمانت،
                  نیاز شما به ابزارهای جانبی و روش فعال‌سازی را هم بررسی کنید. در NEO AI
                  مشخصات هر محصول قبل از ثبت درخواست در اختیار شما قرار می‌گیرد.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="principles-section">
          <div className="container">
            <div className="section-intro principles-intro" data-reveal>
              <div>
                <span className="section-label">فرایند</span>
                <h2>ساده، روشن،<br />بدون حاشیه.</h2>
              </div>
              <span className="section-index">03</span>
            </div>

            <div className="process-map" data-reveal>
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
          <div className="container future-grid" data-reveal>
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
          <div className="container faq-grid" data-reveal>
            <div>
              <span className="section-label">شفافیت</span>
              <h2>سوال‌های<br />مهم، جواب‌های<br /><span>روشن.</span></h2>
            </div>
            <div className="faq-list">
              <FaqItem question="آیا پرداخت به‌صورت آنلاین انجام می‌شود؟">
                پرداخت به‌صورت کارت‌به‌کارت انجام می‌شود. اطلاعات کارت و مبلغ دقیق داخل فرم سفارش نمایش داده می‌شود و پس از انتقال وجه، می‌توانید همان‌جا سفارش را ثبت کنید.
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
          <div className="container final-cta-inner" data-reveal>
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
          <a href="/" className="brand"><span className="brand-symbol"><Sparkles size={15} /></span><span>NEO AI</span></a>
          <div className="footer-note">فروشگاه دسترسی‌های حرفه‌ای هوش مصنوعی</div>
          <a href="#products" className="footer-link">محصولات <ArrowLeft size={15} /></a>
        </div>
        <div className="container footer-bottom">
          <span>© ۱۴۰۵ NEO AI · تمامی حقوق محفوظ است.</span>
          <span>ساخته‌شده برای انتخاب بهتر.</span>
        </div>
      </footer>

      <OrderModal
        product={selectedProduct}
        method={selectedMethod}
        isOpen={!!selectedProduct}
        onClose={closeOrder}
        status={status}
        orderStage={orderStage}
        continueToForm={continueToForm}
        continueShopping={continueShopping}
        continueToPayment={continueToPayment}
        backToForm={backToForm}
        form={form}
        updateField={updateField}
        submitOrder={submitOrder}
        total={total}
        payment={PAYMENT}
        cartProducts={cartProducts}
        cartCount={cartCount}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        copiedPayment={copiedPayment}
        copyPaymentValue={copyPaymentValue}
      />

      <AnimatePresence>
        {multiMethodProduct && (
          <MultiMethodProductModal
            key="mm-modal"
            product={multiMethodProduct}
            isOpen={!!multiMethodProduct}
            onClose={() => setMultiMethodProduct(null)}
            onProceedToOrder={openOrder}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductShowcase({ product, index, onOrder, revealDelay = 0 }) {
  const isMultiMethod = product.methods && product.methods.length > 1;
  const lowestPrice = product.methods ? Math.min(...product.methods.map(m => m.price)) : product.price;
  const features = product.methods ? product.methods[0].features || [] : product.features;
  const description = product.description || 'فروشگاه دسترسی حرفه‌ای به ابزارهای هوش مصنوعی';

  const ref = useRef(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const mouseXpx = useMotionValue(0);
  const mouseYpx = useMotionValue(0);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  const smoothXpx = useSpring(mouseXpx, springConfig);
  const smoothYpx = useSpring(mouseYpx, springConfig);

  const sheenX = useTransform(smoothX, [0, 1], ['-100%', '100%']);
  const sheenY = useTransform(smoothY, [0, 1], ['-100%', '100%']);

  const onMouseMove = (e) => {
    if (reducedMotion || isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
    mouseXpx.set(e.clientX - rect.left - 200); // 200 is half the glow width
    mouseYpx.set(e.clientY - rect.top - 200);
  };

  const onMouseLeave = () => {
    if (reducedMotion || isTouch) return;
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const onMouseEnter = () => {
    import('./components/ThreeDCard').catch(() => {});
  };

  const floatAnimation = isTouch && !reducedMotion ? {
    y: [-4, 4, -4],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  } : {};

  return (
    <motion.article
      ref={ref}
      layoutId={isMultiMethod ? `card-${product.id}` : undefined}
      className={`product-showcase product-showcase-${index} product-showcase-${product.accent}`}
      data-reveal
      style={{ 
        '--reveal-delay': `${revealDelay}ms`
      }}
      animate={floatAnimation}
      whileHover={reducedMotion || isTouch ? {} : { scale: 1.015, zIndex: 10 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {!reducedMotion && !isTouch && (
        <>
          <div className="product-border-glow-wrapper" aria-hidden="true">
            <motion.div 
              className="product-border-glow"
              style={{ x: smoothXpx, y: smoothYpx }}
            />
          </div>
          <motion.div 
            className="product-sheen" 
            style={{ x: sheenX, y: sheenY }}
            aria-hidden="true"
          />
        </>
      )}
      
      <div className={`product-visual product-visual-${product.accent}`}>
        <div className="product-visual-glow" aria-hidden="true" />
        <div className="product-visual-top">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span>{product.category}</span>
        </div>
        <div className="product-brand-mark">
          <motion.img
            layoutId={isMultiMethod ? `logo-${product.id}` : undefined}
            src={product.logo}
            alt=""
            className="product-brand-logo"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="product-visual-name">
          <motion.h3 layoutId={isMultiMethod ? `title-${product.id}` : undefined} style={{margin:0, fontSize:'inherit', fontWeight:'inherit'}}>
            {product.name}
          </motion.h3>
        </div>
        <div className="product-visual-line" />
        <span className="product-visual-caption">ESSENTIAL ACCESS / {String(index + 1).padStart(2, '0')}</span>
        <div className="visual-stack" aria-hidden="true">
          {product.accent === 'google' ? (
            <><span>GEMINI</span><span>FLOW</span><span>JULES</span><span>NOTEBOOKLM</span></>
          ) : (
            <><span>CHAT</span><span>REASON</span><span>CREATE</span><span>PLUS</span></>
          )}
        </div>
      </div>
      <div className="product-info">
        <div className="product-meta"><span>{product.provider}</span><span>{product.badge || (isMultiMethod ? 'چند روش' : '')}</span></div>
        <h3>{product.name}</h3>
        <p>{description}</p>
        <div className="feature-rows">
          {features.slice(0, 6).map((feature, featureIndex) => (
            <div key={feature}>
              <span className="feature-number">{String(featureIndex + 1).padStart(2, '0')}</span>
              <Check size={15} /><span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="product-buy">
          <div><span>شروع قیمت از</span><strong>{formatMoney(lowestPrice, product.currency)}</strong></div>
          <button className="button button-dark" onClick={(e) => onOrder(e, product)}>
            {isMultiMethod ? 'مشاهده روش‌ها' : 'افزودن به سبد'}<ArrowLeft size={17} />
          </button>
        </div>
        <div className="product-footnote"><span>DIRECT REQUEST</span><span>{String(index + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}</span></div>
      </div>
    </motion.article>
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
  return formatTotal(total)
}

function OrderModal({ product, method, isOpen, onClose, status, orderStage, continueToForm, continueShopping, continueToPayment, backToForm, form, updateField, submitOrder, total, payment, copiedPayment, copyPaymentValue, cartProducts, cartCount, updateCartQuantity, removeFromCart }) {
  if (!isOpen) return null

  return (
    <div className="order-backdrop" onMouseDown={onClose} data-lenis-prevent>
      <div className="order-modal" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="order-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="order-close" onClick={onClose} aria-label="بستن"><X size={20} /></button>

        {status === 'success' ? (
          <div className="order-success">
            <span className="success-mark"><Check size={28} /></span>
            <span className="section-label">درخواست دریافت شد</span>
            <h2>ثبت سفارش<br />موفق بود.</h2>
            <p>اطلاعات سفارش شما ثبت شد. پرداخت به‌صورت دستی بررسی می‌شود و پس از تأیید، فرایند فعال‌سازی انجام خواهد شد.</p>
            <button className="button button-dark" onClick={onClose}>بازگشت</button>
          </div>
        ) : orderStage === 'added' ? (
          <div className="order-added">
            <span className="added-mark"><Check size={30} /></span>
            <span className="section-label">به سبد شما اضافه شد</span>
            <h2>سبد شما<br /><span>آماده است.</span></h2>
            <div className="added-product">
              <div className="added-product-icon">
                <img src={product?.accent === 'google' ? '/google-gemini.svg' : '/openai-logo.svg'} alt="" />
              </div>
              <div>
                <strong>{product?.name} {method ? `- ${method.label}` : ''}</strong>
                <span>{product?.provider} · {formatMoney(method ? method.price : product?.price, product?.currency)}</span>
              </div>
            </div>
            <div className="cart-added-meta">
              <span>{formatPrice(cartCount)} محصول در سبد</span>
              <strong>{formatTotal(total, product?.currency)}</strong>
            </div>
            <p>می‌توانید محصولات بیشتری اضافه کنید یا سبد را برای تکمیل خرید باز کنید.</p>
            <div className="added-actions">
              <button className="button button-dark" type="button" onClick={continueToForm}>
                تکمیل خرید
                <ArrowLeft size={17} />
              </button>
              <button className="text-action added-continue" type="button" onClick={continueShopping}>
                ادامه خرید
                <ArrowLeft size={17} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="order-heading">
              <div className="order-step-top">
                <span className="section-label">مرحله اول · اطلاعات سفارش</span>
                {orderStage === 'payment' && (
                  <button className="order-back-link" type="button" onClick={backToForm}>
                    <ArrowUpLeft size={14} />
                    ویرایش اطلاعات
                  </button>
                )}
              </div>
              <h2 id="order-title">تکمیل خرید</h2>
              <p>{formatPrice(cartCount)} محصول در سبد شما</p>
            </div>

            <div className="cart-list">
              {cartProducts.map((item) => (
                <div className="cart-line-item" key={item.product.id}>
                  <div className="cart-line-product">
                    <div className="order-overview-icon">
                      <img src={item.product.accent === 'google' ? '/google-gemini.svg' : '/openai-logo.svg'} alt="" />
                    </div>
                    <div>
                      <strong>{item.product.name} {item.method ? `- ${item.method.label}` : ''}</strong>
                      <span>{item.product.provider}</span>
                    </div>
                  </div>
                  <div className="cart-line-price">
                    <span>{formatMoney(item.method ? item.method.price : item.product.price, item.product.currency)}</span>
                    <strong>{formatTotal((item.method ? item.method.price : item.product.price) * item.quantity, item.product.currency)}</strong>
                  </div>
                  <div className="quantity-selector">
                    <button type="button" onClick={() => updateCartQuantity(item.product.id, item.method?.id, item.quantity - 1)} aria-label="کاهش تعداد"><Minus size={16} /></button>
                    <span>{formatPrice(item.quantity)}</span>
                    <button type="button" onClick={() => updateCartQuantity(item.product.id, item.method?.id, item.quantity + 1)} aria-label="افزایش تعداد"><Plus size={16} /></button>
                  </div>
                  <button className="cart-remove" type="button" onClick={() => removeFromCart(item.product.id, item.method?.id)} aria-label="حذف محصول"><X size={15} /></button>
                </div>
              ))}
            </div>

            {orderStage === 'payment' ? (
              <div className="payment-stage">
                <div className="payment-panel">
                  <div className="payment-panel-head">
                    <div>
                      <span className="section-label">پرداخت کارت‌به‌کارت</span>
                      <h3>مبلغ را انتقال دهید، سپس سفارش را ثبت کنید.</h3>
                    </div>
                    <span className="payment-step">PAY / 02</span>
                  </div>

                  <div className="payment-card">
                    <div className="payment-card-top">
                      <span className="payment-card-chip" aria-hidden="true"><i /><i /><i /></span>
                      <span className="payment-card-brand">NEO PAY</span>
                    </div>
                    <div className="payment-card-number" dir="ltr" aria-label="شماره کارت">
                      {formatCardDigits(payment.cardNumber)}
                    </div>
                    <div className="payment-card-bottom">
                      <div><span>دارنده کارت</span><strong>{payment.holder}</strong></div>
                      <div className="payment-bank"><span>بانک</span><strong>{payment.bank}</strong></div>
                    </div>
                  </div>

                  <div className="payment-copy-grid">
                    <button type="button" className="payment-copy" onClick={() => copyPaymentValue('card', payment.cardNumber)}>
                      <span><span className="payment-copy-label">شماره کارت</span><strong dir="ltr">{formatCardNumber(payment.cardNumber)}</strong></span>
                      <span className="copy-action">{copiedPayment === 'card' ? <><Check size={15} /> کپی شد</> : <><Copy size={15} /> کپی</>}</span>
                    </button>
                    <button type="button" className="payment-copy payment-amount-copy" onClick={() => copyPaymentValue('amount', String(total))}>
                      <span><span className="payment-copy-label">مبلغ دقیق انتقال</span><strong>{formatTotal(total, cartProducts[0]?.product?.currency)}</strong></span>
                      <span className="copy-action">{copiedPayment === 'amount' ? <><Check size={15} /> کپی شد</> : <><Copy size={15} /> کپی مبلغ</>}</span>
                    </button>
                  </div>

                  <div className="payment-note">
                    <span className="payment-note-mark"><Check size={14} /></span>
                    <p>پس از انتقال <strong>{formatTotal(total, cartProducts[0]?.product?.currency)}</strong> به کارت بالا، روی «پرداخت کردم، ثبت سفارش» بزنید. پرداخت شما در این مرحله به‌صورت دستی بررسی می‌شود.</p>
                  </div>
                </div>

                {status === 'error' && <div className="order-error" role="alert">ارسال سفارش انجام نشد. لطفاً دوباره تلاش کنید.</div>}

                <div className="order-submit">
                  <div><span>مجموع</span><strong>{formatTotal(total, cartProducts[0]?.product?.currency)}</strong></div>
                  <button className="button button-dark order-payment-submit" disabled={status === 'sending'} type="button" onClick={submitOrder}>
                    {status === 'sending' ? 'در حال ثبت...' : 'پرداخت کردم، ثبت سفارش'}
                    {status !== 'sending' && <ArrowLeft size={17} />}
                  </button>
                </div>
              </div>
            ) : (
              <form className="order-form" onSubmit={continueToPayment}>
                <div className="form-stage-intro">
                  <span className="section-label">جزئیات سفارش</span>
                  <p>اطلاعات خود را وارد کنید. جزئیات پرداخت در مرحله بعد نمایش داده می‌شود.</p>
                </div>

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

                <div className="order-submit">
                  <div><span>مجموع سفارش</span><strong>{formatTotal(total, cartProducts[0]?.product?.currency)}</strong></div>
                  <button className="button button-dark order-payment-submit" type="submit">
                    ادامه به پرداخت
                    <ArrowLeft size={17} />
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
export default App