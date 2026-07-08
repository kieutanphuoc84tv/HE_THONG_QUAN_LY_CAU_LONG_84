import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { X, ShoppingBag, Search, SlidersHorizontal, RotateCcw, CheckCircle, Clock, Package, ArrowRight } from 'lucide-react'
import CustomerLayout from '../../layouts/CustomerLayout'
import api from '../../services/api'
import styles from './RentalPage.module.css'
import { getStoredToken } from '../../utils/authStorage'

const CATEGORIES = [
  { key: 'all',    label: 'Tất cả' },
  { key: 'giay',   label: 'Giày' },
  { key: 'quanao', label: 'Quần áo' },
  { key: 'vot',    label: 'Vợt' },
  { key: 'khac',   label: 'Khác' },
]

const HOURS_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24]

const SUBCATEGORY_LABELS = {
  VotCauLong: 'Vợt cầu lông',
  VotYonex: 'Vợt cầu lông Yonex',
  VotVictor: 'Vợt cầu lông Victor',
  VotLining: 'Vợt cầu lông Lining',
  VotVS: 'Vợt cầu lông VS',
  VotMizuno: 'Vợt cầu lông Mizuno',
  VotApacs: 'Vợt cầu lông Apacs',
  VotVNB: 'Vợt cầu lông VNB',
  VotProace: 'Vợt cầu lông Proace',
  VotForza: 'Vợt cầu lông Forza',
  VotFlyPower: 'Vợt cầu lông FlyPower',
  VotTenway: 'Vợt cầu lông Tenway',
  VotProKennex: 'Vợt cầu lông Pro Kennex',
  VotBabolat: 'Vợt cầu lông Babolat',
  VotKawasaki: 'Vợt cầu lông Kawasaki',
  VotProtech: 'Vợt cầu lông Protech',
  VotAdonex: 'Vợt cầu lông Adonex',
  VotAdidas: 'Vợt cầu lông Adidas',
  GiayCauLong: 'Giày cầu lông',
  TuiVot: 'Túi vợt / balo cầu lông',
  CauLong: 'Cầu lông / ống cầu',
  DayCuoc: 'Dây cước đan vợt',
  GripQuanCan: 'Grip quấn cán vợt',
}

const PRODUCT_KIND_OPTIONS = [
  { key: 'all', label: 'Tất cả sản phẩm' },
  { key: 'racket', label: 'Vợt' },
  { key: 'shoe', label: 'Giày' },
  { key: 'clothing', label: 'Quần áo' },
  { key: 'other', label: 'Khác' },
]

const BRAND_OPTIONS = [
  { key: 'all', label: 'Tất cả thương hiệu' },
  { key: 'yonex', label: 'Yonex' },
  { key: 'lining', label: 'Lining' },
  { key: 'victor', label: 'Victor' },
  { key: 'mizuno', label: 'Mizuno' },
  { key: 'apacs', label: 'Apacs' },
  { key: 'kawasaki', label: 'Kawasaki' },
  { key: 'vnb', label: 'VNB' },
  { key: 'proace', label: 'Proace' },
  { key: 'forza', label: 'Forza' },
  { key: 'flypower', label: 'FlyPower' },
  { key: 'tenway', label: 'Tenway' },
  { key: 'prokennex', label: 'Pro Kennex' },
  { key: 'babolat', label: 'Babolat' },
  { key: 'protech', label: 'Protech' },
  { key: 'adonex', label: 'Adonex' },
  { key: 'adidas', label: 'Adidas' },
  { key: 'vs', label: 'VS' },
]

const PRICE_RANGE_OPTIONS = [
  { key: 'all', label: 'Tất cả giá thuê', min: 0, max: Infinity },
  { key: 'under20', label: 'Dưới 20K/giờ', min: 0, max: 20000 },
  { key: '20to50', label: '20K - 50K/giờ', min: 20000, max: 50000 },
  { key: '50to100', label: '50K - 100K/giờ', min: 50000, max: 100000 },
  { key: 'over100', label: 'Trên 100K/giờ', min: 100000, max: Infinity },
]

const SEGMENT_OPTIONS = [
  { key: 'all', label: 'Tất cả phân khúc' },
  { key: 'low', label: 'Thấp' },
  { key: 'mid', label: 'Trung' },
  { key: 'high', label: 'Cao' },
]

const RACKET_TYPE_OPTIONS = [
  { key: 'all', label: 'Tất cả loại vợt' },
  { key: 'attack', label: 'Tấn công' },
  { key: 'speed', label: 'Nhanh / linh hoạt' },
  { key: 'control', label: 'Kiểm soát' },
  { key: 'balanced', label: 'Cân bằng' },
]

const SHOE_SIZE_OPTIONS = [
  { key: 'all', label: 'Tất cả size' },
  ...['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map(size => ({
    key: size,
    label: `Size ${size}`,
  })),
]

const SHOE_TYPE_OPTIONS = [
  { key: 'all', label: 'Tất cả loại giày' },
  { key: 'training', label: 'Tập luyện' },
  { key: 'competition', label: 'Thi đấu' },
  { key: 'cushion', label: 'Đệm êm' },
  { key: 'stability', label: 'Ổn định / chống lật' },
]

const GENDER_OPTIONS = [
  { key: 'all', label: 'Nam & nữ' },
  { key: 'nam', label: 'Nam' },
  { key: 'nu', label: 'Nữ' },
  { key: 'unisex', label: 'Unisex' },
]

const SHOE_FORM_OPTIONS = [
  { key: 'all', label: 'Tất cả form' },
  { key: 'slim', label: 'Slim - bàn chân thon' },
  { key: 'unisex', label: 'Unisex' },
  { key: 'regular', label: 'Bàn chân thường' },
  { key: 'wide', label: 'Wide - bàn chân bè' },
]

const defaultFilters = {
  search: '',
  productKind: 'all',
  brand: 'all',
  price: 'all',
  segment: 'all',
  racketType: 'all',
  shoeSize: 'all',
  shoeType: 'all',
  gender: 'all',
  shoeForm: 'all',
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getSearchText(item) {
  return normalizeText([
    item.TenSanPham,
    item.MoTa,
    item.DanhMuc,
    item.DanhMucCon,
    SUBCATEGORY_LABELS[item.DanhMucCon],
  ].filter(Boolean).join(' '))
}

function containsAny(text, terms) {
  return terms.some(term => text.includes(normalizeText(term)))
}

function getProductKind(item) {
  const text = getSearchText(item)
  const subcategory = item.DanhMucCon || ''
  const category = item.DanhMuc || ''
  if (category === 'Giay' || subcategory === 'GiayCauLong' || containsAny(text, ['giày', 'giay', 'shoe'])) return 'shoe'
  if (category === 'Vot' || subcategory.startsWith('Vot') || containsAny(text, ['vợt', 'vot', 'racket'])) return 'racket'
  if (category === 'QuanAo' || category === 'Vay' || containsAny(text, ['quần áo', 'quan ao', 'quần', 'quan', 'áo', 'ao', 'shirt', 'short', 'váy', 'vay'])) return 'clothing'
  return 'other'
}

function getBrand(item) {
  const text = getSearchText(item)
  const brand = BRAND_OPTIONS.find(option => {
    if (option.key === 'all') return false
    return text.includes(normalizeText(option.label))
  })
  return brand?.key || 'other'
}

function getOptionLabel(options, key, fallback = '') {
  return options.find(option => option.key === key)?.label || fallback
}

function getPriceValue(item) {
  return Number(item.GiaThue || 0)
}

function getSegment(item) {
  const text = getSearchText(item)
  if (containsAny(text, ['cao cấp', 'cao cap', 'premium', 'elite'])) return 'high'
  if (containsAny(text, ['trung cấp', 'trung cap', 'mid range'])) return 'mid'
  if (containsAny(text, ['giá rẻ', 'gia re', 'phổ thông', 'pho thong', 'cơ bản', 'co ban', 'thấp', 'thap'])) return 'low'

  const price = getPriceValue(item)
  if (price >= 50000) return 'high'
  if (price >= 20000) return 'mid'
  return 'low'
}

function getRacketType(item) {
  const text = getSearchText(item)
  if (containsAny(text, ['nanoflare', 'tốc độ', 'toc do', 'nhanh', 'speed', 'linh hoạt', 'linh hoat'])) return 'speed'
  if (containsAny(text, ['tấn công', 'tan cong', 'attack', 'power', 'smash', 'head heavy', 'astrox', 'voltric'])) return 'attack'
  if (containsAny(text, ['kiểm soát', 'kiem soat', 'control', 'arcsaber'])) return 'control'
  if (containsAny(text, ['cân bằng', 'can bang', 'balanced', 'even balance'])) return 'balanced'
  return ''
}

function getShoeType(item) {
  const text = getSearchText(item)
  if (containsAny(text, ['thi đấu', 'thi dau', 'competition', 'match'])) return 'competition'
  if (containsAny(text, ['đệm', 'dem', 'êm', 'em', 'cushion'])) return 'cushion'
  if (containsAny(text, ['ổn định', 'on dinh', 'chống lật', 'chong lat', 'stability'])) return 'stability'
  if (containsAny(text, ['tập luyện', 'tap luyen', 'training'])) return 'training'
  return ''
}

function matchesShoeSize(item, selectedSize) {
  if (selectedSize === 'all') return true
  const text = getSearchText(item)
  return new RegExp(`(^|\\D)${selectedSize}(\\D|$)`).test(text)
}

function matchesGender(item, selectedGender) {
  if (selectedGender === 'all') return true
  const text = ` ${getSearchText(item)} `
  if (selectedGender === 'unisex') {
    return containsAny(text, ['unisex', 'nam nữ', 'nam nu', 'nam/nu', 'nam-nu'])
  }
  if (selectedGender === 'nam') {
    return containsAny(text, [' nam ', ' men ', ' male ']) && !containsAny(text, ['nam nữ', 'nam nu', 'nam/nu', 'nam-nu'])
  }
  return containsAny(text, [' nữ ', ' nu ', ' women ', ' female '])
}

function matchesShoeForm(item, selectedForm) {
  if (selectedForm === 'all') return true
  const text = getSearchText(item)
  const checks = {
    slim: ['slim', 'thon', 'narrow', 'bàn chân thon', 'ban chan thon'],
    unisex: ['unisex'],
    regular: ['thường', 'thuong', 'regular', 'standard', 'bàn chân thường', 'ban chan thuong'],
    wide: ['wide', 'bè', 'be', 'rộng', 'rong', 'bàn chân bè', 'ban chan be'],
  }
  return containsAny(text, checks[selectedForm] || [])
}

function getEmoji(name = '') {
  const n = name.toLowerCase()
  if (n.includes('vợt') || n.includes('vot') || n.includes('racket')) return '🏸'
  if (n.includes('giày') || n.includes('giay') || n.includes('shoe')) return '👟'
  if (n.includes('váy') || n.includes('vay') || n.includes('skirt')) return '🎽'
  if (n.includes('nước') || n.includes('nuoc') || n.includes('drink') || n.includes('bình')) return '💧'
  if (n.includes('túi') || n.includes('bag')) return '🎒'
  if (n.includes('quần') || n.includes('quan') || n.includes('áo') || n.includes('ao')) return '👕'
  if (n.includes('cầu') || n.includes('cau') || n.includes('shuttlecock')) return '🪶'
  if (n.includes('đồng hồ') || n.includes('watch')) return '⌚'
  if (n.includes('gậy') || n.includes('gay')) return '🥢'
  if (n.includes('bóng') || n.includes('bong') || n.includes('ball')) return '🏐'
  if (n.includes('thức ăn') || n.includes('thuc an') || n.includes('bánh') || n.includes('banh') || n.includes('snack')) return '🍱'
  return '📦'
}

function getCategoryForProduct(item) {
  const text = getSearchText(item)
  const category = item.DanhMuc || ''
  const subcategory = item.DanhMucCon || ''

  if (category === 'Giay' || subcategory === 'GiayCauLong' || containsAny(text, ['giày', 'giay', 'shoe'])) return 'giay'
  if (category === 'Vot' || subcategory.startsWith('Vot') || containsAny(text, ['vợt', 'vot', 'racket'])) return 'vot'
  if (category === 'QuanAo' || category === 'Vay' || containsAny(text, ['quần áo', 'quan ao', 'quần', 'quan', 'áo', 'ao', 'shirt', 'short', 'váy', 'vay'])) return 'quanao'
  return 'khac'
}

export default function RentalPage() {
  const navigate = useNavigate()
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [detailProduct, setDetailProduct]   = useState(null)
  const [rentProduct, setRentProduct]       = useState(null)
  const [form, setForm] = useState({ soLuong: 1, soGio: 1, ghiChu: '', size: '' })
  const [selectedSizes, setSelectedSizes] = useState({})
  const [filters, setFilters] = useState(defaultFilters)
  const [submitting, setSubmitting]     = useState(false)
  const [successInfo, setSuccessInfo]   = useState(null) // { tenSP, soLuong, soGio, tongTien, ghiChu }

  const token = getStoredToken()
  const isLoggedIn = !!token

  useEffect(() => {
    api.get('/rentals/available')
      .then(r => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const setFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'productKind' && value !== 'racket') next.racketType = 'all'
      if (key === 'productKind' && value !== 'shoe') {
        next.shoeSize = 'all'
        next.shoeType = 'all'
        next.gender = 'all'
        next.shoeForm = 'all'
      }
      return next
    })
  }

  const filtered = products.filter(product => {
    if (activeCategory !== 'all' && getCategoryForProduct(product) !== activeCategory) return false

    const text = getSearchText(product)
    const keyword = normalizeText(filters.search.trim())
    if (keyword && !text.includes(keyword)) return false

    const productKind = getProductKind(product)
    if (filters.productKind !== 'all' && productKind !== filters.productKind) return false

    if (filters.brand !== 'all' && getBrand(product) !== filters.brand) return false

    const priceRange = PRICE_RANGE_OPTIONS.find(option => option.key === filters.price)
    const price = getPriceValue(product)
    if (priceRange && filters.price !== 'all' && (price < priceRange.min || price > priceRange.max)) return false

    if (filters.segment !== 'all' && getSegment(product) !== filters.segment) return false

    if (filters.racketType !== 'all' && getRacketType(product) !== filters.racketType) return false

    if (filters.shoeSize !== 'all' && !matchesShoeSize(product, filters.shoeSize)) return false
    if (filters.shoeType !== 'all' && getShoeType(product) !== filters.shoeType) return false
    if (filters.gender !== 'all' && !matchesGender(product, filters.gender)) return false
    if (filters.shoeForm !== 'all' && !matchesShoeForm(product, filters.shoeForm)) return false

    return true
  })

  const activeFilterCount = Object.entries(filters).filter(([, value]) => (
    value !== '' && value !== 'all'
  )).length

  const selectSize = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }))
  }

  const openRent = (product) => {
    if (!isLoggedIn) { navigate('/login'); return }
    setRentProduct(product)
    const size = selectedSizes[product.MaSanPham] || ''
    setForm({ soLuong: 1, soGio: 1, ghiChu: '', size })
  }

  const closeRent = () => setRentProduct(null)

  const rentalPrice = rentProduct ? getPriceValue(rentProduct) : 0
  const totalCost = rentProduct
    ? rentalPrice * form.soGio * form.soLuong
    : 0

  const handleSubmitRent = async () => {
    if (!rentProduct) return
    setSubmitting(true)
    try {
      const ghiChuParts = []
      if (form.size) ghiChuParts.push(`Size: ${form.size}`)
      if (form.ghiChu) ghiChuParts.push(form.ghiChu)
      const fullGhiChu = ghiChuParts.join(' | ')

      await api.post('/rentals/order', {
        MaSanPham: rentProduct.MaSanPham,
        SoLuong: form.soLuong,
        SoGioThue: form.soGio,
        GhiChu: fullGhiChu || null,
      })
      // Hiện popup thông tin đầy đủ thay vì alert()
      setSuccessInfo({
        tenSP: rentProduct.TenSanPham,
        hinhAnh: rentProduct.HinhAnh,
        soLuong: form.soLuong,
        soGio: form.soGio,
        tongTien: totalCost,
        ghiChu: form.ghiChu,
      })
      closeRent()
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi đặt thuê. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CustomerLayout>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        {/* Left Racket */}
        <img 
          src="/racket_3d.png" 
          alt="" 
          style={{
            position: 'absolute',
            left: '-60px',
            top: '50%',
            transform: 'translateY(-50%) rotate(25deg)',
            height: '180%',
            opacity: 0.85,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            filter: 'contrast(1.3)'
          }} 
        />

        {/* Right Racket */}
        <img 
          src="/racket_3d.png" 
          alt="" 
          style={{
            position: 'absolute',
            right: '-60px',
            top: '50%',
            transform: 'translateY(-50%) rotate(-25deg) scaleX(-1)',
            height: '180%',
            opacity: 0.85,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            filter: 'contrast(1.3)'
          }} 
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className={styles.heroEmoji}>🛍️</span>
          <h1 className={styles.heroTitle}>Thuê Dụng Cụ Cầu Lông</h1>
          <p className={styles.heroSub}>Giày, quần áo, vợt — sẵn sàng cho mọi trận đấu</p>
        </div>
      </div>

      <div className={styles.container}>
        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`${styles.tab} ${activeCategory === cat.key ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.filterPanel}>
          <div className={styles.filterHead}>
            <div className={styles.filterTitle}>
              <SlidersHorizontal size={18} />
              <span>Bộ lọc sản phẩm</span>
            </div>
            <div className={styles.filterActions}>
              <span className={styles.resultCount}>{filtered.length} sản phẩm</span>
              {activeFilterCount > 0 && (
                <button
                  className={styles.clearFiltersBtn}
                  onClick={() => setFilters(defaultFilters)}
                  title="Xóa bộ lọc"
                >
                  <RotateCcw size={14} />
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={18} />
            <input
              className={styles.searchInput}
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Tìm vợt, giày, thương hiệu, size..."
            />
          </div>

          <div className={styles.filterGrid}>
            <label className={styles.filterField}>
              <span>Loại sản phẩm</span>
              <select value={filters.productKind} onChange={e => setFilter('productKind', e.target.value)}>
                {PRODUCT_KIND_OPTIONS.map(option => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Thương hiệu</span>
              <select value={filters.brand} onChange={e => setFilter('brand', e.target.value)}>
                {BRAND_OPTIONS.map(option => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Giá thuê</span>
              <select value={filters.price} onChange={e => setFilter('price', e.target.value)}>
                {PRICE_RANGE_OPTIONS.map(option => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Phân khúc</span>
              <select value={filters.segment} onChange={e => setFilter('segment', e.target.value)}>
                {SEGMENT_OPTIONS.map(option => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>

            {filters.productKind === 'racket' && (
              <label className={styles.filterField}>
                <span>Loại vợt</span>
                <select value={filters.racketType} onChange={e => setFilter('racketType', e.target.value)}>
                  {RACKET_TYPE_OPTIONS.map(option => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}

            {filters.productKind === 'shoe' && (
              <>
                <label className={styles.filterField}>
                  <span>Size giày</span>
                  <select value={filters.shoeSize} onChange={e => setFilter('shoeSize', e.target.value)}>
                    {SHOE_SIZE_OPTIONS.map(option => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.filterField}>
                  <span>Loại giày</span>
                  <select value={filters.shoeType} onChange={e => setFilter('shoeType', e.target.value)}>
                    {SHOE_TYPE_OPTIONS.map(option => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.filterField}>
                  <span>Cho nam / nữ</span>
                  <select value={filters.gender} onChange={e => setFilter('gender', e.target.value)}>
                    {GENDER_OPTIONS.map(option => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.filterField}>
                  <span>Form giày</span>
                  <select value={filters.shoeForm} onChange={e => setFilter('shoeForm', e.target.value)}>
                    {SHOE_FORM_OPTIONS.map(option => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
        </div>

        {/* ── Grid ── */}
        <div className={styles.grid}>
          {loading ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyEmoji}>⏳</span>
              <p>Đang tải sản phẩm...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyEmoji}>📭</span>
              <p style={{ fontWeight: 700, fontSize: 16 }}>Không tìm thấy sản phẩm phù hợp</p>
              <p style={{ fontSize: 14 }}>Thử đổi từ khóa hoặc xóa bớt bộ lọc</p>
            </div>
          ) : (
            filtered.map(p => {
              const kind = getProductKind(p);
              const showSize = kind === 'shoe' || kind === 'clothing' || kind === 'skirt';
              return (
                <div key={p.MaSanPham} className={styles.productCard}>
                  <div className={styles.image_container} onClick={() => setDetailProduct(p)}>
                    {p.HinhAnh ? (
                      <img className={styles.productImage} src={p.HinhAnh} alt={p.TenSanPham} />
                    ) : (
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={styles.image}>
                        <path d="M20 5H4V19L13.2923 9.70649C13.6828 9.31595 14.3159 9.31591 14.7065 9.70641L20 15.0104V5ZM2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"></path>
                      </svg>
                    )}
                    <span className={styles.stockBadge}>Còn {p.SoLuong}</span>
                  </div>
                  
                  <div className={styles.title} title={p.TenSanPham}>
                    <span>{p.TenSanPham}</span>
                  </div>

                  {showSize ? (
                    <div className={styles.size}>
                      <span>Size</span>
                      <ul className={styles.list_size}>
                        {(kind === 'shoe' ? ['39', '40', '41', '42', '43'] : ['S', 'M', 'L', 'XL']).map(s => (
                          <li key={s} className={styles.item_list}>
                            <button
                              className={`${styles.item_list_button} ${selectedSizes[p.MaSanPham] === s ? styles.sizeActive : ''}`}
                              onClick={() => selectSize(p.MaSanPham, s)}
                            >{s}</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}></div>
                  )}

                  <div className={styles.action}>
                    <div className={styles.price}>
                      <span>{getPriceValue(p).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <button className={styles.cart_button} onClick={() => openRent(p)} disabled={p.SoLuong === 0 || getPriceValue(p) <= 0}>
                      <svg className={styles.cart_icon} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" strokeLinejoin="round" strokeLinecap="round"></path>
                      </svg>
                      <span>Thuê ngay</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {detailProduct && (
        <div className={styles.overlay} onClick={() => setDetailProduct(null)}>
          <div className={`${styles.modal} ${styles.detailModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>Chi tiết sản phẩm</h3>
              <button className={styles.modalClose} onClick={() => setDetailProduct(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.detailBodyLayout}`}>
              <div className={styles.detailMedia}>
                {detailProduct.HinhAnh ? (
                  <img className={styles.detailImage} src={detailProduct.HinhAnh} alt={detailProduct.TenSanPham} />
                ) : (
                  <span className={styles.detailFallbackEmoji}>{getEmoji(detailProduct.TenSanPham)}</span>
                )}
              </div>
              <div className={styles.detailInfo}>
                <div className={styles.detailTags}>
                  <span>{getOptionLabel(PRODUCT_KIND_OPTIONS, getProductKind(detailProduct), 'Khác')}</span>
                  {getBrand(detailProduct) !== 'other' && (
                    <span>{getOptionLabel(BRAND_OPTIONS, getBrand(detailProduct))}</span>
                  )}
                  <span>{getOptionLabel(SEGMENT_OPTIONS, getSegment(detailProduct))}</span>
                </div>
                <h3 className={styles.detailTitle}>{detailProduct.TenSanPham}</h3>
                
                <div className={styles.detailPriceWrap}>
                  <div className={styles.detailPriceLabel}>Giá cho thuê</div>
                  <div className={styles.detailPriceVal}>
                    {getPriceValue(detailProduct).toLocaleString('vi-VN')}đ<span>/giờ</span>
                  </div>
                </div>

                <div className={styles.detailStock}>
                  <span style={{ fontSize: 16 }}>📦</span> Hiện còn: <strong>{detailProduct.SoLuong} cái</strong>
                </div>

                {detailProduct.MoTa && (
                  <div className={styles.detailDesc}>
                    <h4>Mô tả sản phẩm</h4>
                    <p>{detailProduct.MoTa}</p>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.btnCancel} onClick={() => setDetailProduct(null)}>Đóng</button>
              {detailProduct.SoLuong > 0 && (
                <button className={styles.btnConfirm} onClick={() => { setDetailProduct(null); openRent(detailProduct) }}>
                  <ShoppingBag size={18} />
                  Thuê ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rent Modal (Enhanced) ── */}
      {rentProduct && (() => {
        const kind = getProductKind(rentProduct)
        const showSize = kind === 'shoe' || kind === 'clothing' || kind === 'skirt'
        const sizeOptions = kind === 'shoe' ? ['39', '40', '41', '42', '43'] : ['S', 'M', 'L', 'XL']
        const brand = getBrand(rentProduct)
        const brandLabel = brand !== 'other' ? getOptionLabel(BRAND_OPTIONS, brand) : ''

        return (
          <div className={styles.overlay} onClick={closeRent}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className={styles.modalHead}>
                <h3>Xác nhận đặt thuê</h3>
                <button className={styles.modalClose} onClick={closeRent}><X size={16} /></button>
              </div>
              <div className={styles.modalBody}>

                {/* ── Product Info Card ── */}
                <div style={{
                  display: 'flex', gap: 16, padding: 16,
                  background: '#f8fafc', borderRadius: 14,
                  border: '1px solid #e2e8f0', marginBottom: 20,
                }}>
                  {rentProduct.HinhAnh ? (
                    <img src={rentProduct.HinhAnh} alt="" style={{
                      width: 90, height: 90, borderRadius: 12, objectFit: 'cover',
                      border: '1px solid #e2e8f0', flexShrink: 0,
                    }} />
                  ) : (
                    <div style={{
                      width: 90, height: 90, borderRadius: 12,
                      background: '#f0fdf4', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 32, flexShrink: 0,
                    }}>{getEmoji(rentProduct.TenSanPham)}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {rentProduct.TenSanPham}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {brandLabel && (
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: '#dbeafe', color: '#1e40af',
                        }}>{brandLabel}</span>
                      )}
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: '#f0fdf4', color: '#166534',
                      }}>{getOptionLabel(PRODUCT_KIND_OPTIONS, kind, 'Khác')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>
                        {rentalPrice.toLocaleString('vi-VN')}đ
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>/giờ</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
                      📦 Còn {rentProduct.SoLuong} sản phẩm
                    </div>
                  </div>
                </div>

                {/* ── Size Selection (if applicable) ── */}
                {showSize && (
                  <div className={styles.field}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Size {form.size && <span style={{ color: '#059669', fontWeight: 800 }}>— {form.size}</span>}
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {sizeOptions.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, size: s }))}
                          style={{
                            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            border: form.size === s ? '2px solid #059669' : '1.5px solid #e2e8f0',
                            background: form.size === s ? '#ecfdf5' : '#fff',
                            color: form.size === s ? '#059669' : '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Quantity & Hours ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className={styles.field}>
                    <label>Số lượng</label>
                    <input
                      type="number"
                      min={1}
                      max={rentProduct.SoLuong}
                      value={form.soLuong}
                      onChange={e => setForm(f => ({ ...f, soLuong: Math.min(Math.max(1, +e.target.value), rentProduct.SoLuong) }))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Số giờ thuê</label>
                    <select value={form.soGio} onChange={e => setForm(f => ({ ...f, soGio: +e.target.value }))}>
                      {HOURS_OPTIONS.map(h => (
                        <option key={h} value={h}>{h} giờ</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── Note ── */}
                <div className={styles.field}>
                  <label>Ghi chú (tùy chọn)</label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Cần loại vợt nhẹ, tay thuận trái..."
                    value={form.ghiChu}
                    onChange={e => setForm(f => ({ ...f, ghiChu: e.target.value }))}
                  />
                </div>

                {/* ── Order Summary ── */}
                <div className={styles.totalPreview}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div className={styles.totalLabel}>Tổng tiền thuê ước tính</div>
                    <div className={styles.totalAmount}>{totalCost.toLocaleString('vi-VN')}đ</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#065f46', lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Đơn giá</span>
                      <span>{rentalPrice.toLocaleString('vi-VN')}đ/giờ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Số lượng × Thời gian</span>
                      <span>{form.soLuong} cái × {form.soGio} giờ</span>
                    </div>
                    {form.size && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Size đã chọn</span>
                        <span style={{ fontWeight: 800 }}>{form.size}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.modalFoot}>
                <button className={styles.btnCancel} onClick={closeRent}>Hủy</button>
                <button className={styles.btnConfirm} onClick={handleSubmitRent} disabled={submitting || (showSize && !form.size)}>
                  {submitting ? 'Đang xử lý...' : '✓ Xác nhận đặt thuê'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
      {/* ── Success Modal ── */}
      {successInfo && (
        <div className={styles.overlay} onClick={() => setSuccessInfo(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            {/* Header with success icon */}
            <div style={{
              textAlign: 'center',
              padding: '28px 24px 0',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
              }}>
                <CheckCircle size={32} color="#fff" />
              </div>
              <h3 style={{
                fontSize: 20, fontWeight: 900, color: '#0f172a',
                margin: '0 0 6px'
              }}>Đặt thuê thành công!</h3>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 14px', borderRadius: 20,
                background: '#fef3c7', color: '#92400e',
                fontSize: 12, fontWeight: 800,
              }}>
                <Clock size={13} /> Đang chờ xác nhận
              </div>
            </div>

            {/* Thông tin chi tiết đơn thuê */}
            <div style={{ padding: '20px 24px' }}>
              {/* Tên sản phẩm + hình */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                background: '#f8fafc', border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}>
                {successInfo.hinhAnh ? (
                  <img src={successInfo.hinhAnh} alt="" style={{
                    width: 52, height: 52, borderRadius: 10, objectFit: 'cover',
                    border: '1px solid #e2e8f0',
                  }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: 10,
                    background: '#f0fdf4', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>📦</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800, fontSize: 14, color: '#0f172a',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>{successInfo.tenSP}</div>
                </div>
              </div>

              {/* Chi tiết đơn hàng */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '10px 16px',
              }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: '#f0fdf4', border: '1px solid #d1fae5',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 3 }}>Số lượng</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>{successInfo.soLuong} cái</div>
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: '#eff6ff', border: '1px solid #dbeafe',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 3 }}>Thời gian thuê</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#2563eb' }}>{successInfo.soGio} giờ</div>
                </div>
              </div>

              {/* Tổng tiền */}
              <div style={{
                marginTop: 14, padding: '14px 16px', borderRadius: 14,
                background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                border: '1.5px solid #a7f3d0',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Tổng tiền ước tính</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>
                  {(successInfo.tongTien || 0).toLocaleString('vi-VN')}đ
                </div>
              </div>

              {/* Ghi chú */}
              {successInfo.ghiChu && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 10,
                  background: '#fefce8', border: '1px solid #fef08a',
                  fontSize: 13, color: '#854d0e',
                }}>
                  <span style={{ fontWeight: 800 }}>📝 Ghi chú:</span> {successInfo.ghiChu}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: 10, padding: '0 24px 24px',
            }}>
              <button
                onClick={() => setSuccessInfo(null)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#64748b', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >Tiếp tục thuê</button>
              <Link
                to="/my-rentals"
                onClick={() => setSuccessInfo(null)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', textDecoration: 'none',
                  textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                }}
              >
                <Package size={16} /> Xem đơn thuê <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  )
}
