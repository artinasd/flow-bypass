import { ChevronDown } from 'lucide-react'

export function Features() {
  return (
    <section className="features-section" id="features">
      <div className="container container-narrow">

        <div className="story-block">
          <div className="story-content">
            <span className="story-kicker">JULES AGENT</span>
            <h3 className="story-title">کدنویسی را<br/>بسپار.</h3>
            <p className="story-desc">
              مدل Jules به عنوان بخشی از اکوسیستم هوش مصنوعی شما، پیچیده‌ترین معماری‌های نرم‌افزاری را درک کرده و مستقیماً کد تولید می‌کند.
            </p>
          </div>
          <div className="story-visual">
            <div className="story-visual-inner">{'< JULES />'}</div>
          </div>
        </div>

        <div className="story-block">
          <div className="story-content">
            <span className="story-kicker">NOTEBOOKLM</span>
            <h3 className="story-title">دانش شما،<br/>قابل گفتگو.</h3>
            <p className="story-desc">
              هزاران صفحه مستندات، کتاب و مقاله را بارگذاری کنید. هوش مصنوعی آن را می‌خواند و به یک متخصص آماده پاسخگویی برای شما تبدیل می‌شود.
            </p>
          </div>
          <div className="story-visual">
            <div className="story-visual-inner" style={{ color: 'var(--color-gemini)' }}>{'[ KNOWLEDGE ]'}</div>
          </div>
        </div>

        <div className="story-block">
          <div className="story-content">
            <span className="story-kicker">GOOGLE FLOW</span>
            <h3 className="story-title">از ایده تا<br/>تصویر متحرک.</h3>
            <p className="story-desc">
              ابزار قدرتمند تولید ویدیو و تصویر مستقیماً در دسترس شماست. این قابلیت تنها در پلن فعال‌سازی اختصاصی ارائه می‌شود.
            </p>
          </div>
          <div className="story-visual">
            <div className="story-visual-inner">{'~ FLOW ~'}</div>
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

        <div className="section-header">
          <span className="section-kicker">شفافیت</span>
          <h2 className="section-title">سوالات متداول</h2>
        </div>

        <div className="faq-list">

          <details className="faq-item" name="faq-accordion" open>
            <summary className="faq-summary">
              <span className="faq-question">آیا پرداخت به‌صورت آنلاین انجام می‌شود؟</span>
              <ChevronDown className="faq-chevron" size={24} />
            </summary>
            <div className="faq-answer">
              <p>خیر. این پلتفرم صرفاً برای ثبت درخواست و انتخاب لایسنس طراحی شده است. پس از ثبت موفق، برای هماهنگی امن و انجام پرداخت مستقیماً با شما در ارتباط خواهیم بود.</p>
            </div>
          </details>

          <details className="faq-item" name="faq-accordion">
            <summary className="faq-summary">
              <span className="faq-question">تحویل سفارش چقدر زمان می‌برد؟</span>
              <ChevronDown className="faq-chevron" size={24} />
            </summary>
            <div className="faq-answer">
              <p>پس از هماهنگی پرداخت، فرایند فعال‌سازی معمولاً در کمتر از چند ساعت (در ساعات کاری) تکمیل شده و اطلاعات دسترسی به صورت کامل در اختیار شما قرار می‌گیرد.</p>
            </div>
          </details>

          <details className="faq-item" name="faq-accordion">
            <summary className="faq-summary">
              <span className="faq-question">تفاوت پلن اختصاصی و خانوادگی در چیست؟</span>
              <ChevronDown className="faq-chevron" size={24} />
            </summary>
            <div className="faq-answer">
              <p>پلن فعال‌سازی اختصاصی شامل دسترسی کامل به تمامی ابزارها از جمله Google Flow و هزار اعتبار ماهانه برای تولید محتوا است. پلن خانوادگی گزینه‌ای اقتصادی‌تر بدون دسترسی به Flow است.</p>
            </div>
          </details>

        </div>

      </div>
    </section>
  )
}
