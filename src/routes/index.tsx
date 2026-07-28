import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Gift,
  Heart,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  PackageCheck,
  Plus,
  QrCode,
  ReceiptText,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  User,
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getUser, handleAuthCallback, login, logout, signup, type User as IdentityUser } from '@netlify/identity'
import { demoTokens, findProduct, restaurants, type Restaurant } from '../data/ptp'

export const Route = createFileRoute('/')({ component: PtpApp })

type View = 'landing' | 'customer' | 'merchant'
type ScanState = 'idle' | 'loading' | 'ready' | 'used' | 'error' | 'success'
type AuthMode = 'login' | 'signup'

type PayableItem = {
  qrId: string
  serialNumber: string
  restaurantId: string
  restaurantName: string
  accent: string
  productId: string
  productName: string
  description: string
  imageUrl: string
  subtotalCents: number
  taxCents: number
  totalCents: number
}

type DetectorResult = { rawValue: string }
type DetectorConstructor = new (options: { formats: string[] }) => { detect: (source: ImageBitmapSource) => Promise<DetectorResult[]> }

const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

const recentPayments = [
  { restaurant: 'NovaBites', item: 'Nova Crunch Burger', date: 'Jul 27', amount: '$13.86', color: '#ff6b35', icon: 'NB' },
  { restaurant: 'Solar Sushi', item: 'Eclipse Bento', date: 'Jul 25', amount: '$18.94', color: '#f7b731', icon: 'SS' },
  { restaurant: 'Cloud Kitchen Co.', item: 'Cirrus Chicken Bowl', date: 'Jul 22', amount: '$13.26', color: '#00b894', icon: 'CK' },
  { restaurant: 'Neon Noodles', item: 'Ultraviolet Udon', date: 'Jul 19', amount: '$14.88', color: '#00e5ff', icon: 'NN' },
]

const activity = [
  { time: '12:42 PM', text: 'Nova Crunch Burger redeemed', code: 'NB-0001842', amount: '$13.86' },
  { time: '12:38 PM', text: 'Supernova Tenders redeemed', code: 'NB-0001841', amount: '$11.37' },
  { time: '12:31 PM', text: 'Gravity Greens redeemed', code: 'NB-0001840', amount: '$10.17' },
  { time: '12:18 PM', text: 'Lunar Club redeemed', code: 'NB-0001839', amount: '$12.12' },
]

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><ScanLine size={compact ? 18 : 22} strokeWidth={2.8} /></div>
      {!compact && <div><strong>PTP</strong><span>Picture To Payment</span></div>}
    </div>
  )
}

function RestaurantLogo({ restaurant, small = false }: { restaurant: Restaurant; small?: boolean }) {
  return (
    <div className={`restaurant-logo ${small ? 'small' : ''}`} style={{ '--accent': restaurant.accent, '--glow': restaurant.glow } as React.CSSProperties}>
      <span>{restaurant.short}</span>
    </div>
  )
}

function PtpApp() {
  const [view, setView] = useState<View>('landing')
  const [mobileNav, setMobileNav] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [user, setUser] = useState<IdentityUser | null>(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scanMessage, setScanMessage] = useState('')
  const [token, setToken] = useState('')
  const [payable, setPayable] = useState<PayableItem | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [notice, setNotice] = useState('')
  const [batchOpen, setBatchOpen] = useState(false)

  useEffect(() => {
    const hydrate = async () => {
      try {
        await handleAuthCallback()
        setUser(await getUser())
      } catch {
        setUser(await getUser())
      }
    }
    void hydrate()
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const navigate = (next: View) => {
    setView(next)
    setMobileNav(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validateToken = async (rawToken: string) => {
    const normalized = extractToken(rawToken)
    setToken(normalized)
    setScanState('loading')
    setScanMessage('Verifying secure token and checking redemption status…')
    setPayable(null)
    setScanOpen(true)

    try {
      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: normalized }),
      })
      const result = await response.json() as { item?: PayableItem; error?: string }
      if (response.status === 409) {
        setScanState('used')
        setScanMessage(result.error ?? 'This item has already been paid for.')
        return
      }
      if (!response.ok || !result.item) throw new Error(result.error ?? 'This QR code could not be verified.')
      setPayable(result.item)
      setScanState('ready')
      return
    } catch (error) {
      const demo = demoTokens.find((entry) => entry.token === normalized)
      const found = demo ? findProduct(demo.productId) : null
      if (found && demo) {
        const subtotalCents = Math.round(found.product.price * 100)
        const taxCents = Math.round(subtotalCents * 0.0825)
        setPayable({
          qrId: `preview-${demo.productId}`,
          serialNumber: demo.serial,
          restaurantId: found.restaurant.id,
          restaurantName: found.restaurant.name,
          accent: found.restaurant.accent,
          productId: found.product.id,
          productName: found.product.name,
          description: found.product.description,
          imageUrl: found.product.image,
          subtotalCents,
          taxCents,
          totalCents: subtotalCents + taxCents,
        })
        setScanState('ready')
        setScanMessage('Secure demo preview loaded. Live redemption activates with the deployed database.')
        return
      }
      setScanState('error')
      setScanMessage(error instanceof Error ? error.message : 'This QR code could not be verified.')
    }
  }

  const openDemo = (index: number) => void validateToken(demoTokens[index].token)

  const closeScanner = () => {
    setScanOpen(false)
    setCameraActive(false)
    setScanState('idle')
    setPayable(null)
  }

  return (
    <main className="app-shell">
      {view === 'landing' ? (
        <LandingPage onEnter={() => navigate('customer')} onMerchant={() => navigate('merchant')} onDemo={() => openDemo(0)} />
      ) : (
        <>
          <AppHeader
            view={view}
            user={user}
            mobileNav={mobileNav}
            onNavigate={navigate}
            onToggleMobile={() => setMobileNav((value) => !value)}
            onProfile={() => setProfileOpen(true)}
            onAuth={() => setAuthOpen(true)}
            onScan={() => setScanOpen(true)}
          />
          {view === 'customer' ? (
            <CustomerDashboard
              onScan={() => setScanOpen(true)}
              onDemo={openDemo}
              onRestaurant={setSelectedRestaurant}
              onProfile={() => setProfileOpen(true)}
            />
          ) : (
            <MerchantDashboard onGenerate={() => setBatchOpen(true)} />
          )}
        </>
      )}

      {scanOpen && (
        <ScannerModal
          state={scanState}
          message={scanMessage}
          item={payable}
          token={token}
          cameraActive={cameraActive}
          onCamera={() => setCameraActive(true)}
          onUpload={validateToken}
          onDemo={openDemo}
          onClose={closeScanner}
          onPaid={(paymentId) => {
            setScanState('success')
            setScanMessage(paymentId)
          }}
          onState={setScanState}
        />
      )}
      {profileOpen && <ProfilePanel user={user} onClose={() => setProfileOpen(false)} onAuth={() => { setProfileOpen(false); setAuthOpen(true) }} onLogout={async () => { await logout(); setUser(null); setProfileOpen(false) }} />}
      {authOpen && <AuthModal mode={authMode} onMode={setAuthMode} onClose={() => setAuthOpen(false)} onUser={(nextUser) => { setUser(nextUser); setAuthOpen(false); setNotice('You’re securely signed in.') }} />}
      {selectedRestaurant && <RestaurantPanel restaurant={selectedRestaurant} onClose={() => setSelectedRestaurant(null)} onPay={(productId) => { const demo = demoTokens.find((entry) => entry.productId === productId) ?? demoTokens[0]; setSelectedRestaurant(null); void validateToken(demo.token) }} />}
      {batchOpen && <BatchModal user={user} onClose={() => setBatchOpen(false)} onAuth={() => { setBatchOpen(false); setAuthOpen(true) }} onNotice={setNotice} />}
      {notice && <div className="toast"><CheckCircle2 size={18} />{notice}</div>}
    </main>
  )
}

function AppHeader({ view, user, mobileNav, onNavigate, onToggleMobile, onProfile, onAuth, onScan }: {
  view: View
  user: IdentityUser | null
  mobileNav: boolean
  onNavigate: (view: View) => void
  onToggleMobile: () => void
  onProfile: () => void
  onAuth: () => void
  onScan: () => void
}) {
  return (
    <header className="app-header">
      <button className="logo-button" onClick={() => onNavigate('customer')} aria-label="PTP home"><BrandMark /></button>
      <nav className={mobileNav ? 'main-nav open' : 'main-nav'}>
        <button className={view === 'customer' ? 'active' : ''} onClick={() => onNavigate('customer')}><Smartphone size={17} />Customer</button>
        <button className={view === 'merchant' ? 'active' : ''} onClick={() => onNavigate('merchant')}><Building2 size={17} />Merchant</button>
        <button onClick={onScan}><ScanLine size={17} />Scan & pay</button>
      </nav>
      <div className="header-actions">
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><span /></button>
        <button className="profile-chip" onClick={user ? onProfile : onAuth}>
          <span className="avatar">{user?.email?.slice(0, 1).toUpperCase() ?? 'M'}</span>
          <span><small>{user ? 'Welcome back' : 'Demo profile'}</small><strong>{user?.name ?? user?.email?.split('@')[0] ?? 'Maya Chen'}</strong></span>
          <ChevronDown size={15} />
        </button>
        <button className="mobile-menu" onClick={onToggleMobile} aria-label="Toggle navigation">{mobileNav ? <X /> : <Menu />}</button>
      </div>
    </header>
  )
}

function LandingPage({ onEnter, onMerchant, onDemo }: { onEnter: () => void; onMerchant: () => void; onDemo: () => void }) {
  return (
    <div className="landing">
      <div className="landing-noise" />
      <nav className="landing-nav">
        <BrandMark />
        <div className="landing-links"><a href="#how">How it works</a><a href="#network">Restaurant network</a><a href="#security">Security</a></div>
        <button className="nav-cta" onClick={onEnter}>Open dashboard <ArrowRight size={16} /></button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span><Sparkles size={14} /></span>THE CHECKOUT IS ALREADY IN YOUR HAND</div>
          <h1>See it.<br />Scan it. <em>Paid.</em></h1>
          <p>PTP turns every packaged meal into its own secure checkout. One unique QR. One physical item. One effortless payment.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onEnter}>Start scanning <ScanLine size={19} /></button>
            <button className="secondary-button" onClick={onDemo}><span className="play-dot"><Zap size={14} /></span>Try a live code</button>
          </div>
          <div className="trust-row">
            <div className="avatar-stack"><span>MC</span><span>JL</span><span>AK</span><span>+</span></div>
            <div><div className="stars">★★★★★</div><small>Trusted by 24,000+ early customers</small></div>
          </div>
        </div>

        <div className="hero-stage" aria-label="PTP payment product preview">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-card receipt-preview">
            <div className="preview-top"><div className="mini-logo nova">NB</div><span>NovaBites</span><BadgeCheck size={16} /></div>
            <img src={restaurants[0].menu[0].image} alt="Nova Crunch Burger" />
            <div className="preview-body"><small>READY TO PAY</small><h3>Nova Crunch Burger</h3><div><strong>$13.86</strong><span>Tax included</span></div></div>
          </div>
          <div className="floating-card phone-preview">
            <div className="phone-top"><BrandMark compact /><span>12:42</span></div>
            <div className="scan-window"><div className="scan-corners" /><QrPattern /><div className="laser" /></div>
            <strong>Position code inside frame</strong><span>Authenticating in real time</span>
          </div>
          <div className="verified-pill"><ShieldCheck size={18} /><span><strong>Token verified</strong><small>Never redeemed</small></span></div>
          <div className="paid-burst"><Check size={26} /><span>PAID</span></div>
        </div>
      </section>

      <section className="partner-strip" id="network">
        <span>POWERING FASTER CHECKOUTS AT</span>
        <div>{restaurants.map((restaurant) => <div key={restaurant.id}><RestaurantLogo restaurant={restaurant} small /><strong>{restaurant.name}</strong></div>)}</div>
      </section>

      <section className="process-section" id="how">
        <div className="section-kicker">One code. Zero friction.</div>
        <h2>Payment that moves at<br />the speed of appetite.</h2>
        <div className="process-grid">
          <article><span>01</span><div className="process-icon coral"><QrCode /></div><h3>Unique by design</h3><p>Every physical item receives a cryptographically unique, single-use token at packaging.</p></article>
          <article><span>02</span><div className="process-icon cyan"><Camera /></div><h3>Scan in a second</h3><p>Use the camera or upload a code. Product and price details stay safely in the backend.</p></article>
          <article><span>03</span><div className="process-icon lime"><WalletCards /></div><h3>Confirm, then pay</h3><p>Review the exact item, tax, and total before authorizing the transaction.</p></article>
          <article><span>04</span><div className="process-icon violet"><PackageCheck /></div><h3>Gone when used</h3><p>Successful payment atomically redeems the token so it can never be charged twice.</p></article>
        </div>
      </section>

      <section className="security-section" id="security">
        <div><div className="section-kicker light">Built like a fintech platform</div><h2>What’s on the package<br />stays beautifully simple.</h2><p>The QR stores only an opaque token. Pricing, restaurant details, item records, payment state, and redemption history stay protected behind PTP’s validation layer.</p><button className="light-button" onClick={onMerchant}>Explore merchant tools <ArrowRight size={17} /></button></div>
        <div className="security-stack">
          <div className="security-card"><LockKeyhole /><span><small>PAYMENT TOKEN</small><strong>•••• •••• •••• 4829</strong></span><BadgeCheck /></div>
          <div className="security-card offset"><ShieldCheck /><span><small>CODE STATUS</small><strong>Authentic · Unused</strong></span><span className="pulse-dot" /></div>
          <div className="security-metric"><strong>256-bit</strong><span>token hashing</span></div>
          <div className="security-metric second"><strong>&lt;180ms</strong><span>validation target</span></div>
        </div>
      </section>

      <footer className="landing-footer"><BrandMark /><p>Instant checkout for the physical world.</p><button onClick={onEnter}>Enter PTP <ArrowRight size={16} /></button></footer>
    </div>
  )
}

function CustomerDashboard({ onScan, onDemo, onRestaurant, onProfile }: { onScan: () => void; onDemo: (index: number) => void; onRestaurant: (restaurant: Restaurant) => void; onProfile: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => restaurants.filter((restaurant) => restaurant.name.toLowerCase().includes(search.toLowerCase()) || restaurant.category.toLowerCase().includes(search.toLowerCase())), [search])
  return (
    <div className="dashboard customer-dashboard">
      <section className="welcome-grid">
        <div className="welcome-copy"><span className="dashboard-label">MONDAY, JULY 27</span><h1>Good afternoon, Maya.<br /><em>What looks delicious?</em></h1><p>Scan the unique code on any PTP-powered item to check out instantly.</p></div>
        <button className="points-card" onClick={onProfile}><div><Gift size={22} /><span><small>PTP POINTS</small><strong>2,840</strong></span></div><p>160 points until your next <b>$10 reward</b></p><span className="points-track"><i /></span></button>
      </section>

      <section className="scan-hero-card">
        <div className="scan-copy"><span className="live-pill"><i /> SECURE SCANNER READY</span><h2>Your meal is one<br />scan away.</h2><p>Point your camera at the PTP code printed on the product packaging.</p><div className="scan-actions"><button className="scan-button" onClick={onScan}><ScanLine />Scan QR code</button><button className="upload-button" onClick={onScan}><Upload size={19} />Upload image</button></div><div className="security-note"><ShieldCheck size={16} />Tokens are verified before payment details appear</div></div>
        <div className="scan-art"><div className="scanner-tile"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><QrPattern /><div className="scan-beam" /></div><div className="scan-float one"><CheckCircle2 />Authentic item</div><div className="scan-float two"><Zap />0.8 sec average</div></div>
      </section>

      <section className="demo-row">
        <div><span>NO PACKAGE NEARBY?</span><strong>Try a demo code</strong></div>
        {demoTokens.map((demo, index) => {
          const found = findProduct(demo.productId)!
          return <button key={demo.token} onClick={() => onDemo(index)}><RestaurantLogo restaurant={found.restaurant} small /><span><strong>{found.product.name}</strong><small>{demo.serial}</small></span><ChevronRight /></button>
        })}
      </section>

      <section className="dashboard-section">
        <div className="section-heading"><div><span>DISCOVER</span><h2>Favorite restaurants</h2></div><div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search restaurants" /><SlidersHorizontal size={17} /></div></div>
        <div className="restaurant-grid">
          {filtered.map((restaurant, index) => (
            <button className="restaurant-card" key={restaurant.id} onClick={() => onRestaurant(restaurant)} style={{ '--delay': `${index * 60}ms` } as React.CSSProperties}>
              <div className="restaurant-visual" style={{ background: `linear-gradient(135deg, ${restaurant.accent}, ${restaurant.glow})` }}><RestaurantLogo restaurant={restaurant} /><Heart className={index < 3 ? 'filled' : ''} /><span className="menu-count">{restaurant.menu.length * 3}+ items</span></div>
              <div className="restaurant-info"><div><h3>{restaurant.name}</h3><p>{restaurant.category}</p></div><span className="rating"><Star size={13} fill="currentColor" />{restaurant.rating}</span><div className="restaurant-meta"><span><Clock3 size={14} />{restaurant.eta}</span><span>•</span><span>PTP ready</span></div></div>
            </button>
          ))}
        </div>
      </section>

      <section className="lower-grid">
        <div className="history-card"><div className="card-heading"><div><span>ACTIVITY</span><h2>Payment history</h2></div><button>View all <ChevronRight size={15} /></button></div>{recentPayments.map((payment) => <div className="history-row" key={payment.item}><div className="history-logo" style={{ background: payment.color }}>{payment.icon}</div><div><strong>{payment.item}</strong><span>{payment.restaurant} · {payment.date}</span></div><strong>{payment.amount}</strong><span className="paid-status"><Check size={12} />Paid</span></div>)}</div>
        <div className="wallet-card"><div className="card-heading"><div><span>WALLET</span><h2>Payment methods</h2></div><button className="round-add"><Plus size={17} /></button></div><div className="virtual-card"><div><span className="card-chip" /><span className="contactless">)))</span></div><strong>•••• 4829</strong><div><span>MAYA CHEN</span><span>VISA</span></div></div><button className="wallet-row"><span><CreditCard size={18} />Apple Pay</span><BadgeCheck size={17} /><ChevronRight size={17} /></button><button className="wallet-row"><span><Settings size={18} />Wallet settings</span><ChevronRight size={17} /></button></div>
      </section>
    </div>
  )
}

function MerchantDashboard({ onGenerate }: { onGenerate: () => void }) {
  const [range, setRange] = useState('Last 30 days')
  const statCards = [
    { label: 'Gross revenue', value: '$184,920', change: '+18.4%', icon: CircleDollarSign, tone: 'coral' },
    { label: 'Codes redeemed', value: '14,892', change: '+12.8%', icon: QrCode, tone: 'cyan' },
    { label: 'Active customers', value: '8,421', change: '+9.2%', icon: Users, tone: 'violet' },
    { label: 'Redemption rate', value: '78.6%', change: '+4.1%', icon: TrendingUp, tone: 'lime' },
  ]
  return (
    <div className="dashboard merchant-dashboard">
      <section className="merchant-title"><div><span className="dashboard-label">MERCHANT COMMAND CENTER</span><h1>NovaBites <em>performance</em></h1><p>Live operations across 18 locations and 42 active product batches.</p></div><div><button className="date-select" onClick={() => setRange(range === 'Last 30 days' ? 'This quarter' : 'Last 30 days')}><Clock3 size={16} />{range}<ChevronDown size={15} /></button><button className="merchant-primary" onClick={onGenerate}><Plus size={18} />Generate QR batch</button></div></section>

      <section className="merchant-stats">{statCards.map((stat) => <article key={stat.label}><div className={`stat-icon ${stat.tone}`}><stat.icon /></div><span>{stat.label}</span><strong>{stat.value}</strong><small><TrendingUp size={13} />{stat.change} <i>vs prior period</i></small></article>)}</section>

      <section className="analytics-grid">
        <div className="revenue-chart-card"><div className="card-heading"><div><span>REVENUE</span><h2>Sales velocity</h2></div><button><MoreHorizontal /></button></div><div className="chart-summary"><strong>$184.9k</strong><span>+$28.7k this period</span></div><div className="chart-area"><div className="y-labels"><span>$12k</span><span>$8k</span><span>$4k</span><span>$0</span></div><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 800 240" preserveAspectRatio="none" aria-label="Revenue trend"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b35" stopOpacity=".35" /><stop offset="100%" stopColor="#ff6b35" stopOpacity="0" /></linearGradient></defs><path className="chart-fill" d="M0,195 C70,175 90,185 145,145 C210,95 250,155 310,120 C365,88 405,105 465,62 C525,18 570,84 625,45 C680,8 730,40 800,17 L800,240 L0,240 Z" /><path className="chart-line" d="M0,195 C70,175 90,185 145,145 C210,95 250,155 310,120 C365,88 405,105 465,62 C525,18 570,84 625,45 C680,8 730,40 800,17" /><circle cx="625" cy="45" r="6" /></svg><div className="x-labels"><span>Jun 29</span><span>Jul 6</span><span>Jul 13</span><span>Jul 20</span><span>Jul 27</span></div></div></div>
        <div className="redemption-card"><div className="card-heading"><div><span>INVENTORY</span><h2>Code health</h2></div><button><MoreHorizontal /></button></div><div className="donut-wrap"><div className="donut"><div><strong>18.9k</strong><span>Total codes</span></div></div></div><div className="legend"><div><i className="redeemed" /><span>Redeemed</span><strong>14,892</strong><small>78.6%</small></div><div><i className="unused" /><span>Unused</span><strong>3,726</strong><small>19.7%</small></div><div><i className="expired" /><span>Expired</span><strong>326</strong><small>1.7%</small></div></div></div>
      </section>

      <section className="merchant-lower">
        <div className="batches-card"><div className="card-heading"><div><span>PRODUCTION</span><h2>Active QR batches</h2></div><button>View all <ChevronRight size={15} /></button></div><div className="table-head"><span>Batch</span><span>Product</span><span>Progress</span><span>Revenue</span><span /></div>{[
          ['#NB-0726-A', 'Nova Crunch Burger', '4,821 / 5,000', '96%', '$66,810'],
          ['#NB-0726-B', 'Supernova Tenders', '3,104 / 4,000', '78%', '$35,293'],
          ['#NB-0721-C', 'Gravity Greens', '2,880 / 4,500', '64%', '$29,290'],
          ['#NB-0718-D', 'Lunar Club', '2,142 / 3,500', '61%', '$25,970'],
        ].map((row) => <div className="batch-row" key={row[0]}><span><QrCode size={17} />{row[0]}</span><strong>{row[1]}</strong><span><i><b style={{ width: row[3] }} /></i>{row[2]}</span><strong>{row[4]}</strong><button><Download size={16} /></button></div>)}</div>
        <div className="live-activity"><div className="card-heading"><div><span>LIVE</span><h2>Customer activity</h2></div><span className="live-now"><i />Now</span></div>{activity.map((item) => <div className="activity-row" key={item.code}><span className="activity-check"><Check size={13} /></span><div><strong>{item.text}</strong><span>{item.code} · {item.time}</span></div><strong>{item.amount}</strong></div>)}</div>
      </section>
    </div>
  )
}

function QrPattern() {
  return <div className="qr-pattern"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
}

function ScannerModal({ state, message, item, token, cameraActive, onCamera, onUpload, onDemo, onClose, onPaid, onState }: {
  state: ScanState
  message: string
  item: PayableItem | null
  token: string
  cameraActive: boolean
  onCamera: () => void
  onUpload: (token: string) => void
  onDemo: (index: number) => void
  onClose: () => void
  onPaid: (paymentId: string) => void
  onState: (state: ScanState) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    if (!cameraActive || state !== 'idle') return
    let stream: MediaStream | null = null
    let timer = 0
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        const Detector = (window as typeof window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector
        if (!Detector) {
          setCameraError('Live QR detection is not supported in this browser. Upload an image instead.')
          return
        }
        const detector = new Detector({ formats: ['qr_code'] })
        timer = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return
          const codes = await detector.detect(videoRef.current)
          if (codes[0]?.rawValue) {
            window.clearInterval(timer)
            stream?.getTracks().forEach((track) => track.stop())
            onUpload(codes[0].rawValue)
          }
        }, 700)
      } catch {
        setCameraError('Camera access was blocked. Upload a QR image or use a demo code.')
      }
    }
    void start()
    return () => { window.clearInterval(timer); stream?.getTracks().forEach((track) => track.stop()) }
  }, [cameraActive, onUpload, state])

  const handleFile = async (file?: File) => {
    if (!file) return
    const Detector = (window as typeof window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector
    if (!Detector) {
      onState('error')
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      const codes = await new Detector({ formats: ['qr_code'] }).detect(bitmap)
      if (!codes[0]?.rawValue) throw new Error('No QR code found')
      onUpload(codes[0].rawValue)
    } catch {
      onState('error')
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`scanner-modal state-${state}`}>
        <button className="modal-close" onClick={onClose}><X /></button>
        {state === 'idle' && <div className="scanner-idle"><div className="modal-kicker"><ShieldCheck size={15} />SECURE PTP SCANNER</div><h2>Scan the code<br />on your item.</h2><p>No product details live inside the QR. We verify its one-time token against the secure backend.</p><div className={`camera-shell ${cameraActive ? 'active' : ''}`}>{cameraActive ? <><video ref={videoRef} muted playsInline /><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="camera-line" /></> : <button onClick={onCamera}><div className="camera-icon"><Camera /></div><strong>Use device camera</strong><span>Tap to grant camera access</span></button>}</div>{cameraError && <div className="inline-alert"><AlertTriangle size={16} />{cameraError}</div>}<div className="or-divider"><span>or</span></div><button className="wide-upload" onClick={() => fileRef.current?.click()}><Upload size={19} />Upload QR code image</button><input ref={fileRef} hidden type="file" accept="image/*" onChange={(event) => void handleFile(event.target.files?.[0])} /><div className="quick-demos"><span>Quick demo</span>{demoTokens.map((demo, index) => <button key={demo.token} onClick={() => onDemo(index)}>{demo.serial.split('-')[0]}-{index + 1}</button>)}</div></div>}
        {state === 'loading' && <div className="loading-state"><div className="verify-animation"><QrPattern /><span className="verify-ring one" /><span className="verify-ring two" /><div className="verify-scan" /></div><div className="skeleton-lines"><i /><i /><i /></div><h2>Authenticating item</h2><p>{message}</p><div className="verification-steps"><span className="done"><Check />Token signature</span><span className="active"><LoaderCircle />Redemption status</span><span>Product record</span></div></div>}
        {state === 'ready' && item && <PaymentPanel item={item} token={token} note={message} onPaid={onPaid} onState={onState} />}
        {state === 'used' && <StatusState tone="used" icon={<LockKeyhole />} title="Already paid" message={message} onClose={onClose} />}
        {state === 'error' && <StatusState tone="error" icon={<AlertTriangle />} title="We couldn’t verify that code" message={message || 'No readable PTP QR code was found. Try another image or scan again.'} onClose={() => onState('idle')} />}
        {state === 'success' && <StatusState tone="success" icon={<Check />} title="Payment complete" message={`Receipt ${message.slice(0, 22)}${message.length > 22 ? '…' : ''} · The item token is now permanently redeemed.`} onClose={onClose} />}
      </div>
    </div>
  )
}

function PaymentPanel({ item, token, note, onPaid, onState }: { item: PayableItem; token: string; note: string; onPaid: (paymentId: string) => void; onState: (state: ScanState) => void }) {
  const [paying, setPaying] = useState(false)
  const restaurant = restaurants.find((entry) => entry.id === item.restaurantId) ?? restaurants[0]
  const pay = async () => {
    setPaying(true)
    try {
      const response = await fetch('/api/qr/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, paymentFingerprint: 'demo_wallet_4829', confirmed: true }) })
      const result = await response.json() as { paymentId?: string; error?: string }
      if (response.status === 409) { onState('used'); return }
      if (!response.ok || !result.paymentId) throw new Error(result.error ?? 'Payment could not be completed.')
      onPaid(result.paymentId)
    } catch {
      if (item.qrId.startsWith('preview-')) {
        await new Promise((resolve) => window.setTimeout(resolve, 900))
        onPaid(`preview_${crypto.randomUUID()}`)
      } else onState('error')
    } finally {
      setPaying(false)
    }
  }
  return (
    <div className="payment-panel"><div className="verified-banner"><ShieldCheck /><span><strong>Authentic PTP item</strong><small>Token verified · Never redeemed</small></span><BadgeCheck /></div><div className="payment-product"><div className="payment-image"><img src={item.imageUrl} alt={item.productName} /><RestaurantLogo restaurant={restaurant} small /></div><div><span className="serial">ITEM {item.serialNumber}</span><h2>{item.productName}</h2><p>{item.description}</p><div className="merchant-line"><strong>{item.restaurantName}</strong><span>PTP verified merchant</span></div></div></div>{note && <div className="preview-note"><Sparkles size={15} />{note}</div>}<div className="bill"><div><span>Item subtotal</span><strong>{money(item.subtotalCents)}</strong></div><div><span>Tax</span><strong>{money(item.taxCents)}</strong></div><div className="bill-total"><span>Total due</span><strong>{money(item.totalCents)}</strong></div></div><div className="pay-method"><div className="mini-card">VISA</div><span><strong>Visa ending in 4829</strong><small>Default payment method</small></span><button>Change</button></div><button className="confirm-payment" disabled={paying} onClick={() => void pay()}>{paying ? <><LoaderCircle className="spin" />Processing secure payment…</> : <><LockKeyhole size={18} />Confirm & pay {money(item.totalCents)}</>}</button><p className="confirmation-copy">Payment only begins after you press the confirmation button.</p></div>
  )
}

function StatusState({ tone, icon, title, message, onClose }: { tone: string; icon: React.ReactNode; title: string; message: string; onClose: () => void }) {
  return <div className={`status-state ${tone}`}><div className="status-icon">{icon}</div><span className="status-label">PTP TOKEN STATUS</span><h2>{title}</h2><p>{message}</p>{tone === 'success' && <div className="receipt-mini"><ReceiptText /><span><strong>Receipt saved</strong><small>Payment history · +139 PTP points</small></span><ChevronRight /></div>}<button onClick={onClose}>{tone === 'error' ? 'Try another code' : 'Done'}</button><small><ShieldCheck size={14} />Protected by PTP one-time redemption</small></div>
}

function ProfilePanel({ user, onClose, onAuth, onLogout }: { user: IdentityUser | null; onClose: () => void; onAuth: () => void; onLogout: () => void }) {
  return <div className="drawer-backdrop"><aside className="profile-panel"><button className="modal-close" onClick={onClose}><X /></button><div className="profile-hero"><div className="large-avatar">{user?.email?.slice(0, 1).toUpperCase() ?? 'M'}</div><span className="profile-verified"><BadgeCheck />Verified customer</span><h2>{user?.name ?? 'Maya Chen'}</h2><p>{user?.email ?? 'maya.chen@example.com'}</p>{!user && <button className="profile-login" onClick={onAuth}>Sign in to sync profile</button>}</div><div className="profile-metrics"><div><strong>2,840</strong><span>Points</span></div><div><strong>27</strong><span>Payments</span></div><div><strong>7</strong><span>Favorites</span></div></div><nav className="profile-menu"><button><span><User />Personal information</span><ChevronRight /></button><button><span><CreditCard />Payment methods</span><small>2 saved</small><ChevronRight /></button><button><span><Heart />Favorite restaurants</span><small>7</small><ChevronRight /></button><button><span><ReceiptText />Payment history</span><ChevronRight /></button><button><span><Bell />Notifications</span><i className="toggle on" /><ChevronRight /></button><button><span><Settings />Account settings</span><ChevronRight /></button></nav><div className="loyalty-banner"><Gift /><div><span>NEXT REWARD</span><strong>160 points to $10 off</strong><i><b /></i></div></div>{user && <button className="logout-button" onClick={onLogout}><LogOut size={17} />Sign out</button>}<p className="profile-footer">PTP member since January 2026 · v1.0</p></aside></div>
}

function AuthModal({ mode, onMode, onClose, onUser }: { mode: AuthMode; onMode: (mode: AuthMode) => void; onClose: () => void; onUser: (user: IdentityUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setStatus('')
    try {
      const nextUser = mode === 'login' ? await login(email, password) : await signup(email, password, { full_name: name })
      if (!nextUser.emailVerified && mode === 'signup') setStatus('Check your email to confirm your PTP account.')
      else onUser(nextUser)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Authentication is temporarily unavailable.')
    } finally { setBusy(false) }
  }
  return <div className="modal-backdrop"><div className="auth-modal"><button className="modal-close" onClick={onClose}><X /></button><BrandMark /><div className="auth-copy"><span>SECURE ACCOUNT ACCESS</span><h2>{mode === 'login' ? 'Welcome back.' : 'Join the faster checkout.'}</h2><p>{mode === 'login' ? 'Sign in to sync payments, points, favorites, and merchant tools.' : 'Create your PTP account with secure Netlify Identity.'}</p></div><div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => onMode('login')}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => onMode('signup')}>Create account</button></div><form onSubmit={(event) => void submit(event)}>{mode === 'signup' && <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya Chen" /></label>}<label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<div className="password-field"><input required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>{status && <div className="auth-status"><AlertTriangle />{status}</div>}<button className="auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <LockKeyhole />}{busy ? 'Securing account…' : mode === 'login' ? 'Sign in securely' : 'Create secure account'}</button></form><div className="auth-trust"><ShieldCheck /><span><strong>Protected by Netlify Identity</strong><small>Encrypted session · Role-ready access</small></span></div></div></div>
}

function RestaurantPanel({ restaurant, onClose, onPay }: { restaurant: Restaurant; onClose: () => void; onPay: (productId: string) => void }) {
  return <div className="drawer-backdrop"><aside className="restaurant-panel"><button className="modal-close light-close" onClick={onClose}><X /></button><div className="restaurant-panel-hero" style={{ background: `linear-gradient(135deg, ${restaurant.accent}, ${restaurant.glow})` }}><RestaurantLogo restaurant={restaurant} /><span>PTP VERIFIED</span><h2>{restaurant.name}</h2><p>{restaurant.category}</p><div><span><Star fill="currentColor" />{restaurant.rating}</span><span><Clock3 />{restaurant.eta}</span><span><QrCode />Instant pay</span></div></div><div className="menu-panel"><div className="card-heading"><div><span>PACKAGED & READY</span><h2>Popular items</h2></div><button><SlidersHorizontal /></button></div>{restaurant.menu.map((item, index) => <article className="menu-item" key={item.id}><img src={item.image} alt={item.name} /><div><span>{item.tag}</span><h3>{item.name}</h3><p>{item.description}</p><div><strong>${item.price.toFixed(2)}</strong>{index === 0 ? <button onClick={() => onPay(item.id)}>Demo pay <ScanLine /></button> : <small>QR on package</small>}</div></div></article>)}</div></aside></div>
}

function BatchModal({ user, onClose, onAuth, onNotice }: { user: IdentityUser | null; onClose: () => void; onAuth: () => void; onNotice: (message: string) => void }) {
  const [quantity, setQuantity] = useState(500)
  const [productId, setProductId] = useState(restaurants[0].menu[0].id)
  const [busy, setBusy] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const generate = async () => {
    if (!user) { onAuth(); return }
    setBusy(true)
    try {
      const response = await fetch('/api/merchant/batches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity }) })
      const result = await response.json() as { tokens?: { token: string }[]; error?: string; batchId?: string }
      if (!response.ok || !result.tokens) throw new Error(result.error ?? 'Batch generation failed.')
      const images = await Promise.all(result.tokens.slice(0, 4).map((entry) => QRCode.toDataURL(entry.token, { margin: 1, width: 180, color: { dark: '#111426', light: '#ffffff' } })))
      setPreviews(images)
      onNotice(`${result.batchId} created with ${quantity.toLocaleString()} unique codes.`)
    } catch (error) { onNotice(error instanceof Error ? error.message : 'Batch generation failed.') }
    finally { setBusy(false) }
  }
  return <div className="modal-backdrop"><div className="batch-modal"><button className="modal-close" onClick={onClose}><X /></button><div className="modal-kicker"><QrCode />SECURE BATCH CREATOR</div><h2>Generate unique<br />product codes.</h2><p>Every code receives a random token. Only its SHA-256 hash is stored for verification.</p><label>Product<select value={productId} onChange={(event) => setProductId(event.target.value)}>{restaurants[0].menu.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Batch quantity<div className="quantity-field"><input type="range" min="100" max="5000" step="100" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /><strong>{quantity.toLocaleString()}</strong></div></label><div className="batch-summary"><div><span>Estimated active inventory</span><strong>{quantity.toLocaleString()} items</strong></div><div><span>Token storage</span><strong>Hashed only</strong></div><div><span>Redemption policy</span><strong>One time</strong></div></div>{previews.length > 0 && <div className="qr-previews">{previews.map((preview, index) => <img src={preview} alt={`Generated QR preview ${index + 1}`} key={preview} />)}</div>}<button className="merchant-primary batch-generate" onClick={() => void generate()} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Plus />}{user ? busy ? 'Generating encrypted tokens…' : 'Generate secure batch' : 'Sign in as merchant to generate'}</button></div></div>
}

function extractToken(raw: string) {
  const match = raw.toUpperCase().match(/PTP-[A-Z0-9-]{8,}/)
  if (match) return match[0]
  try { return new URL(raw).searchParams.get('token')?.trim() || raw.trim() } catch { return raw.trim() }
}
