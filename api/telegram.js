import fs from 'node:fs'

const PRODUCTS_PATH = new URL('../src/products.json', import.meta.url)

const json = (res, status, body) => res.status(status).json(body)

const loadProducts = () => JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'))

const formatPrice = (product) => {
  if (product.currency === 'USD') return `$${product.price}`
  return `${new Intl.NumberFormat('fa-IR').format(product.price)} تومان`
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

  const content = Buffer.from(result.content.replace(/\\n/g, ''), 'base64').toString('utf8')
  return { products: JSON.parse(content), sha: result.sha }
}

const saveCatalog = async (githubToken, repository, branch, products, sha) => {
  const encodedPath = 'src/products.json'.split('/').map(encodeURIComponent).join('/')
  return githubRequest(
    'PUT',
    `/repos/${repository}/contents/${encodedPath}`,
    githubToken,
    {
      message: 'Update product prices from Telegram',
      content: Buffer.from(`${JSON.stringify(products, null, 2)}\\n`).toString('base64'),
      sha,
      branch,
    },
  )
}

const findProduct = (products, id) => products.find((product) => product.id === id)

const productListText = (products) => [
  '💰 قیمت‌های فعلی',
  '',
  ...products.map((product) => {
    const discount = product.originalPrice && product.originalPrice !== product.price
      ? ` — قیمت اصلی: ${formatPrice({ ...product, price: product.originalPrice })}`
      : ''
    return `• ${product.id}\\n  ${product.name}: ${formatPrice(product)}${discount}`
  }),
].join('\\n')

const helpText = [
  '🛠 مدیریت قیمت‌ها',
  '',
  '/prices — نمایش قیمت‌های فعلی',
  '/setprice ID PRICE — تعیین قیمت جدید',
  '/discount ID PERCENT — اعمال تخفیف',
  '/resetprice ID — بازگرداندن قیمت اصلی',
  '',
  'مثال:',
  '/setprice google-ai-pro-exclusive 550000',
  '/discount google-ai-pro-exclusive 15',
  '/resetprice google-ai-pro-exclusive',
].join('\\n')

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (webhookSecret && req.headers['x-telegram-bot-api-secret-token'] !== webhookSecret) {
    return json(res, 401, { error: 'Unauthorized' })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = String(process.env.TELEGRAM_ADMIN_CHAT_ID || '')
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

    const [command, ...args] = text.split(/\\s+/)
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
      const [id, rawPrice] = args
      const price = Number(rawPrice)
      if (!id || !Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
        await sendTelegramMessage(token, chatId, '❌ فرمت نادرست است.\\nمثال: /setprice google-ai-pro-exclusive 550000')
        return json(res, 200, { ok: true })
      }

      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, id)
      if (!product) {
        await sendTelegramMessage(token, chatId, `❌ محصول پیدا نشد: ${id}`)
        return json(res, 200, { ok: true })
      }

      product.price = price
      product.originalPrice = price
      delete product.discountPercent
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)

      await sendTelegramMessage(
        token,
        chatId,
        `✅ قیمت ${product.name} به ${formatPrice(product)} تغییر کرد.\\n\\nVercel پس از commit جدید، سایت را دوباره deploy می‌کند.`,
      )
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/discount') {
      const [id, rawPercent] = args
      const percent = Number(rawPercent)
      if (!id || !Number.isFinite(percent) || percent < 0 || percent >= 100) {
        await sendTelegramMessage(token, chatId, '❌ درصد تخفیف باید بین ۰ تا ۹۹ باشد.\\nمثال: /discount google-ai-pro-exclusive 15')
        return json(res, 200, { ok: true })
      }

      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, id)
      if (!product) {
        await sendTelegramMessage(token, chatId, `❌ محصول پیدا نشد: ${id}`)
        return json(res, 200, { ok: true })
      }

      const originalPrice = Number(product.originalPrice || product.price)
      product.originalPrice = originalPrice
      product.price = Math.max(1, Math.round(originalPrice * (1 - percent / 100)))
      product.discountPercent = percent
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)

      await sendTelegramMessage(
        token,
        chatId,
        `🏷️ تخفیف ${percent}% روی ${product.name} اعمال شد.\\nقیمت جدید: ${formatPrice(product)}\\nقیمت اصلی: ${formatPrice({ ...product, price: originalPrice })}\\n\\nVercel پس از commit جدید، سایت را دوباره deploy می‌کند.`,
      )
      return json(res, 200, { ok: true })
    }

    if (normalizedCommand === '/resetprice') {
      const [id] = args
      const catalog = await getCatalog(githubToken, repository, branch)
      const product = findProduct(catalog.products, id)
      if (!product) {
        await sendTelegramMessage(token, chatId, `❌ محصول پیدا نشد: ${id}`)
        return json(res, 200, { ok: true })
      }

      const originalPrice = Number(product.originalPrice)
      if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
        await sendTelegramMessage(token, chatId, '❌ این محصول قیمت اصلی قابل بازیابی ندارد.')
        return json(res, 200, { ok: true })
      }

      product.price = originalPrice
      delete product.discountPercent
      await saveCatalog(githubToken, repository, branch, catalog.products, catalog.sha)

      await sendTelegramMessage(
        token,
        chatId,
        `↩️ قیمت ${product.name} به ${formatPrice(product)} بازگردانده شد.\\n\\nVercel پس از commit جدید، سایت را دوباره deploy می‌کند.`,
      )
      return json(res, 200, { ok: true })
    }

    await sendTelegramMessage(token, chatId, helpText)
    return json(res, 200, { ok: true })
  } catch (error) {
    console.error('Telegram admin error:', error)
    try {
      await sendTelegramMessage(token, chatId, '❌ خطا در به‌روزرسانی قیمت. جزئیات در لاگ Vercel ثبت شده است.')
    } catch {}
    return json(res, 500, { error: 'Telegram admin operation failed.' })
  }
}
