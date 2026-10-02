import { ShieldCheck, Zap, Headphones, ChevronDown } from 'lucide-react'

export function Features() {
  return (
    <section className="features-section" id="why-us">
      <div className="container">

        <div className="section-header">
          <span className="section-kicker">تجربه خرید</span>
          <h2 className="section-title">
            کمتر درگیر فرایند.<br />
            <span className="text-muted">بیشتر درگیر کار.</span>
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Zap size={24} className="feature-icon-main" />
            </div>
            <h3 className="feature-title">انتخاب ساده و سریع</h3>
            <p className="feature-desc">
              پلن موردنظر را انتخاب کنید و فقط اطلاعات ضروری سفارش را وارد کنید. بدون نیاز به ثبت‌نام پیچیده.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={24} className="feature-icon-main" />
            </div>
            <h3 className="feature-title">بررسی و تایید مستقیم</h3>
            <p className="feature-desc">
              درخواست شما مستقیماً برای تیم ما ارسال می‌شود و ادامه فرایند فعال‌سازی با دقت و امنیت انجام می‌شود.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Headphones size={24} className="feature-icon-main" />
            </div>
            <h3 className="feature-title">پشتیبانی انسانی</h3>
            <p className="feature-desc">
              برای پرداخت، تحویل و سوالات بعدی، ارتباط مستقیم و انسانی با شما خواهیم داشت تا خیالتان راحت باشد.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export function FAQ() {
  return (
    <section className="faq-section" id="faq">
      <div className="container faq-container">

        <div className="faq-header">
          <span className="section-kicker">سوالات متداول</span>
          <h2 className="section-title">پاسخ به سوالات شما</h2>
        </div>

        <div className="faq-list">

          <details className="faq-item" name="faq-accordion" open>
            <summary className="faq-summary">
              <span className="faq-question">آیا پرداخت به‌صورت آنلاین انجام می‌شود؟</span>
              <ChevronDown className="faq-chevron" size={20} />
            </summary>
            <div className="faq-answer">
              <p>خیر. این سایت برای ثبت درخواست سفارش طراحی شده است. پس از ثبت، برای هماهنگی نحوه پرداخت و تحویل اشتراک، مستقیماً با شما تماس می‌گیریم.</p>
            </div>
          </details>

          <details className="faq-item" name="faq-accordion">
            <summary className="faq-summary">
              <span className="faq-question">بعد از ثبت سفارش چه اتفاقی می‌افتد؟</span>
              <ChevronDown className="faq-chevron" size={20} />
            </summary>
            <div className="faq-answer">
              <p>اطلاعات سفارش بلافاصله برای ما ارسال می‌شود. پس از بررسی، جزئیات پرداخت و زمان دقیق تحویل (معمولاً در کمتر از چند ساعت) با شما هماهنگ خواهد شد.</p>
            </div>
          </details>

          <details className="faq-item" name="faq-accordion">
            <summary className="faq-summary">
              <span className="faq-question">آیا برای سفارش باید حساب کاربری بسازم؟</span>
              <ChevronDown className="faq-chevron" size={20} />
            </summary>
            <div className="faq-answer">
              <p>خیر. برای کاهش مراحل اضافه و تسریع در ثبت درخواست، نیازی به ساخت حساب کاربری نیست. اطلاعات تماس شما برای پیگیری کافی است.</p>
            </div>
          </details>

        </div>

      </div>
    </section>
  )
}
