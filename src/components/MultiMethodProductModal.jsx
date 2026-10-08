import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowLeft, ArrowDownLeft, ChevronDown, Sparkles } from 'lucide-react';
import '../App.css'; // Assume styles are either in App.css or here

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value);

export default function MultiMethodProductModal({ product, isOpen, onClose, onProceedToOrder }) {
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [helperState, setHelperState] = useState('idle'); // idle, q1, q2, result
  const [helperAnswers, setHelperAnswers] = useState({ budget: null, trial: null });

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
    } else {
      setHelperState('idle');
      setHelperAnswers({ budget: null, trial: null });
    }
  }, [isOpen, product]);

  const handleSelectMethod = (methodId) => {
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
    onClose();
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

  return (
    <div className="mm-backdrop" onClick={handleClose}>
      <motion.div 
        className="mm-modal"
        layoutId={`card-${product.id}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mm-title"
      >
        <div className="mm-glow" style={{ background: `radial-gradient(circle at 50% -20%, ${product.brandColor}33 0%, transparent 60%)` }} />
        
        <button className="mm-close" onClick={handleClose} aria-label="بستن"><X size={20} /></button>

        <div className="mm-header">
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

        <div className="mm-body">
          <div className="mm-selector" role="radiogroup" aria-label="روش‌های فعال‌سازی">
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
          </div>

          <div className="mm-detail-pane" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMethod.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="mm-detail-content"
              >
                <div className="mm-detail-header">
                  <div className="mm-detail-price">
                    {selectedMethod.originalPrice && (
                      <span className="mm-original-price">{formatPrice(selectedMethod.originalPrice)} تومان</span>
                    )}
                    <strong>{formatPrice(selectedMethod.price)} <small>تومان</small></strong>
                  </div>
                  <span className="mm-detail-duration">{selectedMethod.duration}</span>
                </div>

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
              onClick={() => {
                if (window.dataLayer) window.dataLayer.push({ event: 'cta_click', methodId: selectedMethod.id, productId: product.id });
                onProceedToOrder(product, selectedMethod);
              }}
            >
              ثبت سفارش · {formatPrice(selectedMethod.price)} تومان
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
