import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Plus, Minus, ArrowLeft } from 'lucide-react'

export function OrderModal({
  product,
  isOpen,
  onClose,
  status,
  form,
  updateField,
  quantity,
  setQuantity,
  submitOrder,
  total
}) {
  // Return early if we don't have a product selected for rendering purposes
  // AnimatePresence handles the actual unmount logic via isOpen prop
  const formatPrice = (num) => new Intl.NumberFormat('fa-IR').format(num)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose} aria-label="بستن">
              <X size={20} strokeWidth={2.5} />
            </button>

            {status === 'success' ? (
              <div className="modal-success">
                <CheckCircle className="success-icon" size={64} strokeWidth={1.5} />
                <h2 className="success-title">ثبت شد.</h2>
                <p className="success-desc">
                  درخواست لایسنس دریافت شد. فرایند فعال‌سازی به زودی آغاز می‌شود و از طریق مسیر ارتباطی هماهنگ خواهیم کرد.
                </p>
                <button className="btn btn-secondary btn-full mt-8" onClick={onClose}>
                  بازگشت به پلتفرم
                </button>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <span className="modal-kicker">ثبت اطلاعات سفارش</span>
                  <h2 id="modal-title" className="modal-title">{product?.name}</h2>
                </div>

                <div className="modal-summary">
                  <span className="summary-label">تعرفه پایه لایسنس</span>
                  <span className="summary-value fa-num">{formatPrice(product?.price / 1000)} هزار تومان</span>
                </div>

                <form onSubmit={submitOrder} className="modal-form">

                  <div className="form-group row-group">
                    <label className="form-label" htmlFor="quantity">تعداد اکانت</label>
                    <div className="quantity-selector">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                        aria-label="کاهش تعداد"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span id="quantity" className="qty-value fa-num">{formatPrice(quantity)}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQuantity((v) => Math.min(99, v + 1))}
                        aria-label="افزایش تعداد"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="name">نام و نام خانوادگی <span className="req">*</span></label>
                      <input
                        id="name"
                        className="form-input"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">شماره تماس <span className="req">*</span></label>
                      <input
                        id="phone"
                        dir="ltr"
                        type="tel"
                        className="form-input text-left fa-num"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        required
                        autoComplete="tel"
                        placeholder="09..."
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="company">نام سازمان یا کسب‌وکار <span className="opt">(اختیاری)</span></label>
                    <input
                      id="company"
                      className="form-input"
                      value={form.company}
                      onChange={(e) => updateField('company', e.target.value)}
                      autoComplete="organization"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="form-error" role="alert">
                      ارتباط با سرور برقرار نشد. لطفاً مجدداً تلاش کنید.
                    </div>
                  )}

                  <div className="modal-footer">
                    <div className="modal-total">
                      <span className="total-label">مجموع هزینه لایسنس‌ها</span>
                      <span className="total-value fa-num">{formatPrice(total)} <span style={{fontSize: '0.6em', color: 'var(--color-text-muted)'}}>تومان</span></span>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={status === 'sending'}
                    >
                      {status === 'sending' ? 'در حال ارسال...' : (
                        <>تایید و ارسال <ArrowLeft size={18} strokeWidth={2.5} /></>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
