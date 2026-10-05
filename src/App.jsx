import { useEffect, useMemo, useState, useCallback } from 'react'
import { ArrowDownLeft, ArrowUpLeft, Check, ChevronDown, Minus, Plus, X, ArrowLeft, Sparkles, ShieldCheck, Copy } from 'lucide-react'
import products from './products.json'
import './App.css'

const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value)
const formatMoney = (product) => product?.currency === 'USD' ? '$' + product.price : `${formatPrice(product?.price)} تومان`
const formatTotal = (product, total) => product?.currency === 'USD' ? `${total}` : `${formatPrice(total)} تومان`

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', notes: '' })
  const [status, setStatus] = useState('idle')
  const [copiedPayment, setCopiedPayment] = useState('')