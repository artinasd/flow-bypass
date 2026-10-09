import fs from 'node:fs'

const PRODUCTS_PATH = new URL('../src/products.json', import.meta.url)

const json = (res, status, body) => res.status(status).json(body)

const loadProducts = () => JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'))

const formatPrice = (method) => {
  if (method.currency === 'USD') return `$${method.price}`
  return `${new Intl.NumberFormat('fa-IR').format(method.price || 0)} تومان`
}

const telegramRequest = async (token, method, body) => {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const result = await response.json()
  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram ${method} failed`)
  }

  return result
}

const sendTelegramMessage = (token, chatId, text) =>
  telegramRequest(token, 'sendMessage', { chat_id: chatId, text })

const githubRequest = async (method, path, token, body) => {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'GitHub API request failed')
  return result
}

const getCatalog = async (githubToken, repository, branch) => {
  const encodedPath = 'src/products.json'.split('/').map(encodeURIComponent).join('/')
  const result = await githubRequest(
    'GET',
    `/repos/${repository}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
    githubToken,
  )

  const content = Buffer.from(result.content.replace(/\n/g, ''), 'base64').toString('utf8')
  return { products: JSON.parse(content), sha: result.sha }
}

const saveCatalog = async (githubToken, repository, branch, products, sha) => {
  const encodedPath = 'src/products.json'.split('/').map(encodeURIComponent).join('/')
  return githubRequest(
    'PUT',
    `/repos/${repository}/contents/${encodedPath}`,
    githubToken,
    {
      message: 'Update products via Telegram Bot',
      content: Buffer.from(`${JSON.stringify(products, null, 2)}\n`).toString('base64'),
      sha,
      branch,
    },
  )
}

const findProduct = (products, id) => products.find((product) => product.id === id)
const findMethod = (product, id) => product?.methods?.find((method) => method.id === id)

const productListText = (products) => [
  '💰 محصولات و قیمت‌ها',
  '',
  ...products.map((product) => {
    const methodsText = product.methods?.map(method => {
      const discount = method.originalPrice && method.originalPrice !== method.price
        ? ` — اصلی: ${formatPrice({ ...method, price: method.originalPrice })}`
        : ''
      return `  • ${method.id} (${method.label}): ${formatPrice(method)}${discount}`
    }).join('\n') || '  بدون متد'
    return `📦 ${product.id} (${product.name})\n${methodsText}`
  }),
].join('\n')

const helpText = [
  '🛠 مدیریت محصولات و قیمت‌ها',
  '',
  '📦 مدیریت قیمت و تخفیف:',
  '/prices — نمایش محصولات و قیمت‌های فعلی',
  '/setprice PRODUCT_ID METHOD_ID PRICE — تعیین قیمت',
  '/discount PRODUCT_ID METHOD_ID PERCENT — اعمال تخفیف',
  '/resetprice PRODUCT_ID METHOD_ID — بازگرداندن قیمت اصلی',
  '',
  '🛒 مدیریت محصولات:',
  '/addproduct ID NAME PROVIDER CATEGORY — افزودن محصول جدید',
  '/editproduct ID FIELD VALUE — ویرایش محصول (name, provider, category, logo, brandColor, accent)',
  '/delproduct ID — حذف محصول',
  '',
  '⚙️ مدیریت متدها (روش‌های خرید):',
  '/addmethod PRODUCT_ID METHOD_ID LABEL PRICE — افزودن متد',
  '/editmethod PRODUCT_ID METHOD_ID FIELD VALUE — ویرایش متد (label, tag, price, duration, deliveryTime, recommended)',
  '/delmethod PRODUCT_ID METHOD_ID — حذف متد',
  '',
  'مثال‌ها:',
  '/setprice google-ai-pro exclusive 550000',
  '/addproduct spotify Spotify Spotify "موزیک"',
  '/addmethod spotify premium "اکانت پرمیوم" 150000',
].join('\n')

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (webhookSecret && req.headers['x-telegram-bot-api-secret-token'] !== webhookSecret) {
    return json(res, 401, { error: 'Unauthorized' })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = String(process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '')
  const githubToken = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY || 'artinasd/flow-bypass'
  const branch = process.env.GITHUB_BRANCH || 'main'

  if (!token || !adminChatId || !githubToken) {
    return json(res, 500, { error: 'Server configuration error.' })
  }

  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const message = update?.message
    const chatId = String(message?.chat?.id || '')
    const text = String(message?.text || '').trim()

    if (!message || !text) return json(res, 200, { ok: true })
    if (chatId !== adminChatId) return json(res, 200, { ok: true })

    const [command, ...args] = text.split(/\s+/)
    const normalizedCommand = command.split('@')[0].toLowerCase()

    if (normalizedCommand === '/start' || normalizedCommand === '/help') {
      await sendTelegramMessage(token, chatId, helpText)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/prices') {
      await sendTelegramMessage(token, chatId, productListText(loadProducts()))
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/setprice') {
      const [productId, methodId, rawPrice] = args
      const price = Number(rawPrice)
      if (!productId || !methodId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
        await sendTelegramMessage(token, chatId, '❌ فرمت نادرست است.\nمثال: /setprice google-ai-pro exclusive 550000')
        return json(res, 200, { ok: true })
      }

      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, productId)
      const method = findMethod(product, methodId)
      
      if (!method) {
        await sendTelegramMessage(token, chatId, `❌ محصول یا متد پیدا نشد.`)
        return json(res, 200, { ok: true })
      }

      method.price = price
      method.originalPrice = price
      delete method.discountPercent
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)

      await sendTelegramMessage(token, chatId, `✅ قیمت ${product.name} (${method.label}) تغییر کرد.`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/discount') {
      const [productId, methodId, rawPercent] = args
      const percent = Number(rawPercent)
      if (!productId || !methodId || !Number.isFinite(percent) || percent < 0 || percent >= 100) {
        await sendTelegramMessage(token, chatId, '❌ فرمت نادرست است.\nمثال: /discount google-ai-pro exclusive 15')
        return json(res, 200, { ok: true })
      }

      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, productId)
      const method = findMethod(product, methodId)
      
      if (!method) {
        await sendTelegramMessage(token, chatId, `❌ محصول یا متد پیدا نشد.`)
        return json(res, 200, { ok: true })
      }

      const originalPrice = Number(method.originalPrice || method.price)
      method.originalPrice = originalPrice
      method.price = Math.max(1, Math.round(originalPrice * (1 - percent / 100)))
      method.discountPercent = percent
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)

      await sendTelegramMessage(token, chatId, `🏷️ تخفیف ${percent}% روی ${product.name} (${method.label}) اعمال شد.\nقیمت جدید: ${formatPrice(method)}\nقیمت اصلی: ${formatPrice({ ...method, price: originalPrice })}`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/resetprice') {
      const [productId, methodId] = args
      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, productId)
      const method = findMethod(product, methodId)
      
      if (!method) {
        await sendTelegramMessage(token, chatId, `❌ محصول یا متد پیدا نشد.`)
        return json(res, 200, { ok: true })
      }

      const originalPrice = Number(method.originalPrice)
      if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
        await sendTelegramMessage(token, chatId, '❌ این متد قیمت اصلی قابل بازیابی ندارد.')
        return json(res, 200, { ok: true })
      }

      method.price = originalPrice
      delete method.discountPercent
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)

      await sendTelegramMessage(token, chatId, `↩️ قیمت ${product.name} (${method.label}) به ${formatPrice(method)} بازگردانده شد.`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/addproduct') {
      const [id, name, provider, ...categoryParts] = args
      const category = categoryParts.join(' ')
      if (!id || !name || !provider || !category) {
        await sendTelegramMessage(token, chatId, '❌ فرمت: /addproduct ID NAME PROVIDER CATEGORY')
        return json(res, 200, { ok: true })
      }
      const catalog = await getCatalog(githubToken, repository, branch)
      if (findProduct(catalog.products, id)) {
        await sendTelegramMessage(token, chatId, '❌ محصولی با این ID وجود دارد.')
        return json(res, 200, { ok: true })
      }
      catalog.products.push({ id, name, provider, category, methods: [] })
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)
      await sendTelegramMessage(token, chatId, `✅ محصول ${name} افزوده شد.`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/editproduct') {
      const [id, field, ...valueParts] = args
      let value = valueParts.join(' ')
      if (!id || !field || value === '') {
        await sendTelegramMessage(token, chatId, '❌ فرمت: /editproduct ID FIELD VALUE')
        return json(res, 200, { ok: true })
      }
      const validFields = ['name', 'provider', 'category', 'logo', 'brandColor', 'accent']
      if (!validFields.includes(field)) {
        await sendTelegramMessage(token, chatId, `❌ فیلد نامعتبر. مجاز: ${validFields.join(', ')}`)
        return json(res, 200, { ok: true })
      }
      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, id)
      if (!product) {
        await sendTelegramMessage(token, chatId, '❌ محصول پیدا نشد.')
        return json(res, 200, { ok: true })
      }
      product[field] = value
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)
      await sendTelegramMessage(token, chatId, `✅ فیلد ${field} در محصول ${product.name} ویرایش شد.`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/delproduct') {
      const [id] = args
      if (!id) {
        await sendTelegramMessage(token, chatId, '❌ فرمت: /delproduct ID')
        return json(res, 200, { ok: true })
      }
      const catalog = await getCatalog(githubToken, repository, branch)
      const initialLength = catalog.products.length
      catalog.products = catalog.products.filter(p => p.id !== id)
      if (catalog.products.length === initialLength) {
        await sendTelegramMessage(token, chatId, '❌ محصول پیدا نشد.')
        return json(res, 200, { ok: true })
      }
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)
      await sendTelegramMessage(token, chatId, `✅ محصول ${id} حذف شد.`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/addmethod') {
      const [productId, methodId, label, rawPrice] = args
      const price = Number(rawPrice)
      if (!productId || !methodId || !label || !Number.isFinite(price)) {
        await sendTelegramMessage(token, chatId, '❌ فرمت: /addmethod PRODUCT_ID METHOD_ID LABEL PRICE')
        return json(res, 200, { ok: true })
      }
      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, productId)
      if (!product) {
        await sendTelegramMessage(token, chatId, '❌ محصول پیدا نشد.')
        return json(res, 200, { ok: true })
      }
      if (!product.methods) product.methods = []
      if (findMethod(product, methodId)) {
        await sendTelegramMessage(token, chatId, '❌ این متد قبلاً وجود دارد.')
        return json(res, 200, { ok: true })
      }
      product.methods.push({ id: methodId, label, price, originalPrice: price, requirements: [], steps: [], notes: [], features: [] })
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)
      await sendTelegramMessage(token, chatId, `✅ متد ${methodId} به محصول ${product.name} افزوده شد.`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/editmethod') {
      const [productId, methodId, field, ...valueParts] = args
      let value = valueParts.join(' ')
      if (!productId || !methodId || !field || value === '') {
        await sendTelegramMessage(token, chatId, '❌ فرمت: /editmethod PRODUCT_ID METHOD_ID FIELD VALUE')
        return json(res, 200, { ok: true })
      }
      const validFields = ['label', 'tag', 'price', 'duration', 'deliveryTime', 'recommended']
      if (!validFields.includes(field)) {
        await sendTelegramMessage(token, chatId, `❌ فیلد نامعتبر. مجاز: ${validFields.join(', ')}`)
        return json(res, 200, { ok: true })
      }
      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, productId)
      const method = findMethod(product, methodId)
      if (!method) {
        await sendTelegramMessage(token, chatId, '❌ محصول یا متد پیدا نشد.')
        return json(res, 200, { ok: true })
      }
      
      if (field === 'price') value = Number(value)
      else if (field === 'recommended') value = value.toLowerCase() === 'true'
      
      method[field] = value
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)
      await sendTelegramMessage(token, chatId, `✅ فیلد ${field} در متد ${method.label} ویرایش شد.`)
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/delmethod') {
      const [productId, methodId] = args
      if (!productId || !methodId) {
        await sendTelegramMessage(token, chatId, '❌ فرمت: /delmethod PRODUCT_ID METHOD_ID')
        return json(res, 200, { ok: true })
      }
      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, productId)
      if (!product || !product.methods) {
        await sendTelegramMessage(token, chatId, '❌ محصول پیدا نشد.')
        return json(res, 200, { ok: true })
      }
      const initialLength = product.methods.length
      product.methods = product.methods.filter(m => m.id !== methodId)
      if (product.methods.length === initialLength) {
        await sendTelegramMessage(token, chatId, '❌ متد پیدا نشد.')
        return json(res, 200, { ok: true })
      }
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)
      await sendTelegramMessage(token, chatId, `✅ متد ${methodId} از محصول ${product.name} حذف شد.`)
      return json(res, 200, { ok: true })
    }

    await sendTelegramMessage(token, chatId, helpText)
    return json(res, 200, { ok: true })
  } catch (error) {
    console.error('Telegram admin error:', error)
    try {
      await sendTelegramMessage(token, chatId, '❌ خطا در پردازش درخواست. لاگ‌ها را بررسی کنید.')
    } catch {}
    return json(res, 500, { error: 'Telegram admin operation failed.' })
  }
}
