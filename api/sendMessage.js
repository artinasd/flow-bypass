import fs from 'node:fs'

const PRODUCTS_PATH = new URL('../src/products.json', import.meta.url)

const PRODUCTS = Object.fromEntries(JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8')).map((product) => [product.id, product]))

const loadProducts = () => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'))
  return Object.fromEntries(products.map((product) => [product.id, product]))
}

const json = (res, status, body) => res.status(status).json(body)

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const customer = body?.customer
    const items = body?.items

    if (!customer || !Array.isArray(items) || items.length === 0 || items.length > 10) {
      return json(res, 400, { error: 'اطلاعات سفارش نامعتبر است.' })
    }

    const name = String(customer.name || '').trim()
    const company = String(customer.company || '').trim()
    const phone = String(customer.phone || '').trim()
    const email = String(customer.email || '').trim()
    const notes = String(customer.notes || '').trim()

    if (!name || !phone || name.length > 100 || phone.length > 40 || company.length > 120 || email.length > 160 || notes.length > 1000) {
      return json(res, 400, { error: 'اطلاعات واردشده معتبر نیست.' })
    }

    const resolvedItems = items.map((item) => {
      const product = PRODUCTS[item?.productId]
      const quantity = Number(item?.quantity)
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('INVALID_ITEM')
      return { ...product, quantity }
    })

    const currencies = new Set(resolvedItems.map((item) => item.currency || 'TOMAN'))
    if (currencies.size > 1) return json(res, 400, { error: 'سفارش هم‌زمان محصولات با ارز متفاوت مجاز نیست.' })
    const currency = resolvedItems[0]?.currency || 'TOMAN'
    const total = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const formatItemPrice = (value) => currency === 'USD' ? `${value}` : `${new Intl.NumberFormat('fa-IR').format(value)} تومان`
    const lines = [
      '🛍️ سفارش جدید از وب‌سایت',
      '',
      `👤 نام: ${name}`,
      company ? `🏢 کسب‌وکار: ${company}` : '',
      `📱 تماس: ${phone}`,
      email ? `✉️ ایمیل: ${email}` : '',
      '',
      '📦 سفارش:',
      ...resolvedItems.map((item) => `• ${item.name} × ${item.quantity} — ${formatItemPrice(item.price * item.quantity)}`),
      '',
      `💰 مجموع: ${formatItemPrice(total)}`,
      notes ? `📝 توضیحات: ${notes}` : '',
      '',
      `🕐 ${new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date())}`,
    ].filter(Boolean).join('\n')

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!botToken || !chatId) return json(res, 500, { error: 'Server configuration error.' })

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines }),
    })

    if (!telegramResponse.ok) {
      const telegramError = await telegramResponse.text()
      console.error('Telegram delivery failed:', telegramResponse.status, telegramError)
      return json(res, 502, { error: 'ارسال سفارش انجام نشد.' })
    }

    return json(res, 200, { success: true })
  } catch (error) {
    if (error?.message === 'INVALID_ITEM') return json(res, 400, { error: 'محصول یا تعداد سفارش نامعتبر است.' })
    console.error('Order submission failed:', error)
    return json(res, 500, { error: 'ارسال سفارش انجام نشد.' })
  }
}
