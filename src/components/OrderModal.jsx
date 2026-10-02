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
  if (!isOpen) return null

  const formatPrice = (num) => new Intl.NumberFormat('fa-IR').format(num)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose} aria-label="بستن">
              <X size={20} />
            </button>

            {status === 'success' ? (
              <div className="modal-success">
                <CheckCircle className="success-icon" size={64} />
                <h2 className="success-title">سفارش شما ثبت شد</h2>
                <p className="success-desc">
                  اطلاعات سفارش با موفقیت برای ما ارسال شد. برای هماهنگی پرداخت و تحویل، به زودی با شما تماس خواهیم گرفت.
                </p>
                <button className="btn btn-secondary btn-full mt-6" onClick={onClose}>
                  بازگشت به سایت
                </button>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <span className="modal-kicker">ثبت سفارش</span>
                  <h2 id="modal-title" className="modal-title">{product?.name}</h2>
                  <p className="modal-desc">{product?.description}</p>
                </div>

                <div className="modal-summary">
                  <span className="summary-label">قیمت هر اشتراک</span>
                  <span className="summary-value">{formatPrice(product?.price)} تومان</span>
                </div>

                <form onSubmit={submitOrder} className="modal-form">

                  <div className="form-group row-group">
                    <label className="form-label" htmlFor="quantity">تعداد اشتراک</label>
                    <div className="quantity-selector">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                        aria-label="کاهش تعداد"
                      >
                        <Minus size={16} />
                      </button>
                      <span id="quantity" className="qty-value">{formatPrice(quantity)}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setQuantity((v) => Math.min(99, v + 1))}
                        aria-label="افزایش تعداد"
                      >
                        <Plus size={16} />
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
                        className="form-input text-left"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        required
                        autoComplete="tel"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="company">نام کسب‌وکار <span className="opt">(اختیاری)</span></label>
                      <input
                        id="company"
                        className="form-input"
                        value={form.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        autoComplete="organization"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="email">ایمیل <span className="opt">(اختیاری)</span></label>
                      <input
                        id="email"
                        dir="ltr"
                        type="email"
                        className="form-input text-left"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes">توضیحات <span className="opt">(اختیاری)</span></label>
                    <textarea
                      id="notes"
                      className="form-textarea"
                      value={form.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {status === 'error' && (
                    <div className="form-error" role="alert">
                      خطایی در ارسال سفارش رخ داد. لطفاً دوباره تلاش کنید.
                    </div>
                  )}

                  <div className="modal-footer">
                    <div className="modal-total">
                      <span className="total-label">مجموع قابل پرداخت</span>
                      <span className="total-value">{formatPrice(total)} تومان</span>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={status === 'sending'}
                    >
                      {status === 'sending' ? 'در حال ارسال...' : (
                        <>ثبت درخواست سفارش <ArrowLeft size={18} /></>
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
