import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion';

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function OdometerDigit({ digit }) {
  const y = Number(digit) * -10;
  
  return (
    <span className="odometer-digit">
      <motion.span 
        initial={{ y: `${y}%` }}
        animate={{ y: `${y}%` }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="odometer-digit-col"
      >
        {persianDigits.map(d => <span key={d}>{d}</span>)}
      </motion.span>
    </span>
  );
}

function OdometerPrice({ price }) {
  const formatted = new Intl.NumberFormat('en-US').format(price);
  
  return (
    <span className="odometer-price" dir="ltr">
      {formatted.split('').map((char, i) => {
        if (char === ',') return <span key={`comma-${i}`} className="odometer-comma">،</span>;
        const distFromEnd = formatted.length - i; 
        return <OdometerDigit key={`d-${distFromEnd}`} digit={char} />;
      })}
    </span>
  );
}
import CSSCardFallback from './CSSCardFallback';

const ThreeDCard = React.lazy(() => import('./ThreeDCard'));

const check3DSupport = () => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (navigator.connection && navigator.connection.saveData) return false;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return false;
  } catch (e) {
    return false;
  }
  return true;
};
import { Check, X, ArrowLeft, ArrowDownLeft, ChevronDown, Sparkles } from 'lucide-react';
import '../App.css'; // Assume styles are either in App.css or here

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value);

export default function MultiMethodProductModal({ product, isOpen, onClose, onProceedToOrder }) {
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [helperState, setHelperState] = useState('idle'); // idle, q1, q2, result
  const [helperAnswers, setHelperAnswers] = useState({ budget: null, trial: null });
  const [slideDir, setSlideDir] = useState(1);
  const prevIndex = useRef(0);
  
  const [isMobile, setIsMobile] = useState(false);
  const [canUse3D, setCanUse3D] = useState(false);
  const controls = useAnimation();
  const y = useMotionValue(0);

  useEffect(() => {
    setCanUse3D(check3DSupport());
    const checkMobile = () => setIsMobile(window.innerWidth <= 700);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && product) {
      const urlParams = new URLSearchParams(window.location.search);
      const methodFromUrl = urlParams.get('method');
      const planFromUrl = urlParams.get('plan');
      
      let initialMethod = null;
      if (planFromUrl === product.id && methodFromUrl) {
        initialMethod = product.methods.find(m => m.id === methodFromUrl);
      }
      
      if (!initialMethod) {
        initialMethod = product.methods.find(m => m.recommended) || product.methods[0];
      }
      
      setSelectedMethodId(initialMethod.id);
      
      if (planFromUrl !== product.id) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('plan', product.id);
        newUrl.searchParams.set('method', initialMethod.id);
        window.history.replaceState({}, '', newUrl);
      }

      if (isMobile) {
        controls.start({ y: window.innerHeight * 0.32 }); // Start at ~60% snap point
      }
    } else {
      setHelperState('idle');
      setHelperAnswers({ budget: null, trial: null });
    }
  }, [isOpen, product, isMobile, controls]);

  const handleSelectMethod = (methodId) => {
    const newIdx = product.methods.findIndex(m => m.id === methodId);
    setSlideDir(newIdx >= prevIndex.current ? -1 : 1);
    prevIndex.current = newIdx;
    
    setSelectedMethodId(methodId);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('plan', product.id);
    newUrl.searchParams.set('method', methodId);
    window.history.replaceState({}, '', newUrl);
    
    // Analytics hook
    if (window.dataLayer) window.dataLayer.push({ event: 'method_select', methodId, productId: product.id });
  };

  const handleClose = () => {
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('plan');
    newUrl.searchParams.delete('method');
    window.history.replaceState({}, '', newUrl);
    if (isMobile) {
      controls.start({ y: window.innerHeight }).then(onClose);
    } else {
      onClose();
    }
  };

  const handleDragEnd = (e, info) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    const partialY = window.innerHeight * 0.32;

    if (velocity > 400 || offset > partialY + 100) {
      handleClose();
    } else if (offset > partialY / 2 || velocity > 100) {
      controls.start({ y: partialY, transition: { type: 'spring', damping: 25, stiffness: 200 } });
    } else {
      controls.start({ y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } });
    }
  };

  if (!isOpen || !product) return null;

  const selectedMethod = product.methods.find(m => m.id === selectedMethodId) || product.methods[0];

  const handleHelperAnswer = (q, answer) => {
    const newAnswers = { ...helperAnswers, [q]: answer };
    setHelperAnswers(newAnswers);
    if (q === 'budget') {
      setHelperState('q2');
    } else if (q === 'trial') {
      setHelperState('result');
      // Logic to pick best method based on answers
      let bestMethod = product.methods[0];
      let reason = '';
      if (newAnswers.trial === 'yes') {
        bestMethod = product.methods.find(m => m.id === 'trial') || product.methods[0];
        reason = 'چون می‌خواستی اول امتحان کنی، نسخه تست پیشنهاد میشه.';
      } else if (newAnswers.budget === 'low') {
        bestMethod = product.methods.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
        reason = 'بر اساس بودجه کم، ارزان‌ترین نسخه پیشنهاد میشه.';
      } else {
        bestMethod = product.methods.find(m => m.recommended) || product.methods[0];
        reason = 'بهترین و به‌صرفه‌ترین پیشنهاد ما برای شما.';
      }
      handleSelectMethod(bestMethod.id);
      
      // Analytics hook
      if (window.dataLayer) window.dataLayer.push({ event: 'helper_used', result: bestMethod.id });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  
  const childVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
  };

  return (
    <motion.div 
      className="mm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div 
        className="mm-modal"
        layoutId={`card-${product.id}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-title"
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: window.innerHeight }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ y: isMobile ? y : 0 }}
      >
        {isMobile && <div className="mm-drag-handle" aria-hidden="true" />}
        <div className="mm-glow" style={{ background: `radial-gradient(circle at 50% -20%, ${product.brandColor}33 0%, transparent 60%)` }} />
        
        <button className="mm-close" onClick={handleClose} aria-label="بستن"><X size={20} /></button>

        <div className="mm-hero-3d">
          {canUse3D ? (
             <Suspense fallback={<CSSCardFallback methodId={selectedMethod.id} accentColor={product.brandColor} />}>
               <ThreeDCard methodId={selectedMethod.id} />
             </Suspense>
          ) : (
             <CSSCardFallback methodId={selectedMethod.id} accentColor={product.brandColor} />
          )}
        </div>

        <div className="mm-header" style={{ paddingTop: 16 }}>
          <motion.img 
            layoutId={`logo-${product.id}`} 
            src={product.logo} 
            alt="" 
            className="mm-logo" 
          />
          <div>
            <motion.h2 layoutId={`title-${product.id}`} id="mm-title">{product.name}</motion.h2>
            <p>چگونه می‌خواهید فعال کنید؟</p>
          </div>
        </div>

        <motion.div 
          className="mm-body"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={childVariants} className="mm-selector" role="radiogroup" aria-label="روش‌های فعال‌سازی">
            {product.methods.map((method) => {
              const isSelected = method.id === selectedMethodId;
              return (
                <button
                  key={method.id}
                  className={`mm-method-btn ${isSelected ? 'is-selected' : ''}`}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectMethod(method.id)}
                  tabIndex={isSelected ? 0 : -1}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="method-highlight"
                      className="mm-method-highlight"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="mm-method-content">
                    <div className="mm-method-top">
                      <span className="mm-method-label">{method.label}</span>
                      {method.tag && <span className="mm-method-tag">{method.tag}</span>}
                      {method.recommended && <span className="mm-method-rec">پیشنهاد ما</span>}
                    </div>
                    <div className="mm-method-price">{formatPrice(method.price)} <small>تومان</small></div>
                  </div>
                </button>
              );
            })}
            
            <div className="mm-helper-box">
              {helperState === 'idle' && (
                <button className="mm-helper-trigger" onClick={() => setHelperState('q1')}>
                  <Sparkles size={16} /> مطمئن نیستید؟ کمک برای انتخاب
                </button>
              )}
              {helperState === 'q1' && (
                <div className="mm-helper-flow">
                  <p>بودجه‌ات چقدره؟</p>
                  <div className="mm-helper-options">
                    <button onClick={() => handleHelperAnswer('budget', 'low')}>کم</button>
                    <button onClick={() => handleHelperAnswer('budget', 'mid')}>متوسط</button>
                    <button onClick={() => handleHelperAnswer('budget', 'any')}>مهم نیست</button>
                  </div>
                </div>
              )}
              {helperState === 'q2' && (
                <div className="mm-helper-flow">
                  <p>می‌خوای اول امتحان کنی؟</p>
                  <div className="mm-helper-options">
                    <button onClick={() => handleHelperAnswer('trial', 'yes')}>بله</button>
                    <button onClick={() => handleHelperAnswer('trial', 'no')}>نه</button>
                  </div>
                </div>
              )}
              {helperState === 'result' && (
                <div className="mm-helper-flow">
                  <p className="mm-helper-success"><Check size={16} /> انتخاب شد</p>
                  <span className="mm-helper-reason">بر اساس انتخاب شما بهترین گزینه پیشنهاد شد.</span>
                  <button className="text-action" onClick={() => setHelperState('idle')} style={{marginTop: 8}}>از نو</button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={childVariants} className="mm-detail-pane" aria-live="polite">
            <div className="mm-detail-header">
              <div className="mm-detail-price">
                <AnimatePresence mode="popLayout">
                  {selectedMethod.originalPrice && (
                    <motion.span 
                      key="orig"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="mm-original-price"
                    >
                      {formatPrice(selectedMethod.originalPrice)} تومان
                    </motion.span>
                  )}
                </AnimatePresence>
                <strong><OdometerPrice price={selectedMethod.price} /> <small>تومان</small></strong>
              </div>
              <AnimatePresence mode="wait">
                <motion.span 
                  key={selectedMethod.id} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="mm-detail-duration"
                >
                  {selectedMethod.duration}
                </motion.span>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMethod.id}
                initial={{ opacity: 0, x: slideDir * 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mm-detail-content"
              >
                <div className="mm-detail-grid">
                  <div className="mm-info-block">
                    <h4>نیاز از سمت شما:</h4>
                    <ul>
                      {selectedMethod.requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>
                  <div className="mm-info-block">
                    <h4>زمان تحویل:</h4>
                    <p>{selectedMethod.deliveryTime}</p>
                  </div>
                </div>

                <div className="mm-timeline">
                  <svg className="mm-timeline-line" viewBox="0 0 100 2" preserveAspectRatio="none">
                    <motion.line 
                      x1="0" y1="1" x2="100" y2="1" 
                      stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="mm-timeline-steps">
                    {selectedMethod.steps.map((step, idx) => (
                      <div key={idx} className="mm-timeline-step">
                        <motion.div className="mm-timeline-dot" initial={{scale:0}} animate={{scale:1}} transition={{delay: idx * 0.15}} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mm-detail-notes">
                  {selectedMethod.notes.map((note, idx) => (
                    <div key={idx} className="mm-note-item"><Check size={14} /> {note}</div>
                  ))}
                </div>

              </motion.div>
            </AnimatePresence>

            <button 
              className="button button-dark mm-cta"
              onClick={(e) => {
                if (window.dataLayer) window.dataLayer.push({ event: 'cta_click', methodId: selectedMethod.id, productId: product.id });
                onProceedToOrder(e, product, selectedMethod);
              }}
            >
              ثبت سفارش · {formatPrice(selectedMethod.price)} تومان
              <ArrowLeft size={18} />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
