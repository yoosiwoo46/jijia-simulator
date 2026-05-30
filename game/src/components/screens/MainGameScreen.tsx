import { useState, useEffect, useRef, useMemo } from 'react'
import { useGame } from '../../core/GameContext'
import type { WeekPhase } from '../../types'
import { INGREDIENT_CONFIG_MAP, CHANNEL_LABELS, FURNITURE_CONFIG_MAP, SUMMER_MONTHS } from '../../core/constants'
import { calculateTotalNeededIngredients } from '../../systems/OrderSystem'
import ProgressBar from '../ui/ProgressBar'
import WeeklyReportScreen from './WeeklyReportScreen'
import ProcurementScreen from './ProcurementScreen'
import PersonnelScreen from './PersonnelScreen'
import PlatformScreen from './PlatformScreen'
import PrivateDomainScreen from './PrivateDomainScreen'
import RecipeScreen from './RecipeScreen'
import FurnitureScreen from './FurnitureScreen'
import OrderScreen from './OrderScreen'
import B2BScreen from './B2BScreen'
import MarketingScreen from './MarketingScreen'
import ProductionScreen from './ProductionScreen'
import { fmtMoney } from '../../utils/format'

type SubScreenKey = 'review' | 'procurement' | 'personnel' | 'marketing' | 'research' | 'furniture' | 'production' | 'orders' | 'private_domain' | 'b2b' | 'marketing_events'

type MenuItem = {
  key: SubScreenKey
  phase: WeekPhase
  label: string
  icon: string
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'review', phase: 'review', label: '经营周报', icon: '📊' },
  { key: 'procurement', phase: 'procurement', label: '采购原料', icon: '🛒' },
  { key: 'personnel', phase: 'personnel', label: '店员管理', icon: '👥' },
  { key: 'marketing', phase: 'marketing', label: '平台营销', icon: '📱' },
  { key: 'research', phase: 'research', label: '自研拌料', icon: '🔬' },
  { key: 'furniture', phase: 'furniture', label: '店铺装潢', icon: '🪑' },
  { key: 'production', phase: 'advance', label: '生产计划', icon: '📋' },
  { key: 'orders', phase: 'advance', label: '订单系统', icon: '📋' },
]

const EXTRA_ITEMS: { key: SubScreenKey; label: string; icon: string }[] = [
  { key: 'private_domain', label: '私域运营', icon: '💬' },
  { key: 'b2b', label: 'B端客户', icon: '🏢' },
  { key: 'marketing_events', label: '营销活动', icon: '🎉' },
]

function renderSubScreen(key: SubScreenKey) {
  switch (key) {
    case 'review': return <WeeklyReportScreen />
    case 'procurement': return <ProcurementScreen />
    case 'personnel': return <PersonnelScreen />
    case 'marketing': return <PlatformScreen />
    case 'research': return <RecipeScreen />
    case 'furniture': return <FurnitureScreen />
    case 'production': return <ProductionScreen />
    case 'orders': return <OrderScreen />
    case 'private_domain': return <PrivateDomainScreen />
    case 'b2b': return <B2BScreen />
    case 'marketing_events': return <MarketingScreen />
    default: return <WeeklyReportScreen />
  }
}

function TutorialGuide({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    { title: '👋 欢迎来到鸡架老板模拟器！', desc: '你将经营一家鸡架加盟店，从采购到销售，一步步做大做强。' },
    { title: '🛒 第一步：采购原料', desc: '去"采购原料"页面购买生鸡架、拌料等原料，库存不足无法接单。' },
    { title: '👥 第二步：管理店员', desc: '在"店员管理"中分配员工岗位，后厨员工影响产能，收银员影响效率。' },
    { title: '📱 第三步：开通外卖', desc: '在"平台营销"中加入外卖平台，开始接单赚钱。记得关注平台评分！' },
    { title: '📋 第四步：查看生产计划', desc: '每周查看生产计划，了解各渠道订单和原料需求，合理安排采购。' },
    { title: '▶️ 推进下周', desc: '完成本周操作后，点击右上角"推进下周"按钮，进入下一周经营。' },
  ]
  const [current, setCurrent] = useState(0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', padding: '16px',
    }}>
      <div style={{
        maxWidth: '420px', width: '100%', background: 'var(--color-cream, #fdf6e3)',
        borderRadius: '12px', padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '12px' }}>
          {steps[current].title}
        </div>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', lineHeight: '1.8', color: '#333', marginBottom: '16px' }}>
          {steps[current].desc}
        </div>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '10px', color: '#999', marginBottom: '12px' }}>
          {current + 1} / {steps.length}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={onDismiss}>跳过</button>
          {current < steps.length - 1 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setCurrent(current + 1)}>下一步</button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onDismiss}>开始经营！</button>
          )}
        </div>
      </div>
    </div>
  )
}

function DianpingPopup({ ranking, playerRank, onConfirm }: {
  ranking: { name: string; score: number; bonus: string }[]
  playerRank: number | null
  onConfirm: () => void
}) {
  const playerEntry = ranking.find(r => r.name === '你的店铺')
  const isOnList = playerRank !== null && playerRank <= 10
  const topList = isOnList ? ranking : ranking.slice(0, 10)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', padding: '16px',
    }}>
      <div style={{
        maxWidth: '500px', width: '100%', background: 'var(--color-cream, #fdf6e3)',
        borderRadius: '12px', padding: '20px', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-gold)', textAlign: 'center', marginBottom: '16px' }}>
          🏆 大众点评必吃榜 TOP10
        </div>
        <table className="data-table">
          <thead>
            <tr><th>排名</th><th>店铺</th><th>评分</th><th>奖励</th></tr>
          </thead>
          <tbody>
            {topList.map((shop, i) => (
              <tr key={i} style={{
                fontWeight: shop.name === '你的店铺' ? 'bold' : 'normal',
                background: shop.name === '你的店铺' ? 'rgba(255,215,0,0.15)' : undefined,
              }}>
                <td>{i + 1 <= 3 ? ['🥇','🥈','🥉'][i] : i + 1}</td>
                <td>{shop.name}</td>
                <td>{shop.score}分</td>
                <td style={{ fontSize: '10px' }}>{shop.bonus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isOnList && playerEntry && (
          <div style={{
            marginTop: '12px', padding: '10px', background: 'rgba(200,200,200,0.2)',
            borderRadius: '8px', textAlign: 'center',
            fontFamily: 'var(--pixel-font)', fontSize: '12px', color: '#666',
          }}>
            你的店铺：{playerEntry.score}分 — 未上榜
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button className="btn btn-primary btn-sm" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  )
}

function TalentSubsidyPopup({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', padding: '16px',
    }}>
      <div style={{
        maxWidth: '420px', width: '100%', background: 'var(--color-cream, #fdf6e3)',
        borderRadius: '12px', padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '16px' }}>
          🎉 好消息！
        </div>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px', lineHeight: '2', color: '#333', marginBottom: '16px' }}>
          您申请的杭州市人才补贴已到账，<br/>您未来三个月店铺房租为您免除！
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  )
}

export default function MainGameScreen() {
  const { state, dispatch } = useGame()
  const { gameTime, cash, stamina, currentTitle, notifications, absoluteWeek,
    inventory, employees, reviews, channelOrderForecasts, isFranchisePeriod, shop,
    shopName, dianpingRanking, dianpingRank } = state
  const [activeScreen, setActiveScreen] = useState<SubScreenKey>('review')
  const [showDianping, setShowDianping] = useState(false)

  const timerRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const prevWeekRef = useRef(absoluteWeek)

  useEffect(() => {
    if (absoluteWeek !== prevWeekRef.current) {
      prevWeekRef.current = absoluteWeek
      setActiveScreen('review')
    }
  }, [absoluteWeek])

  useEffect(() => {
    if (dianpingRanking && !showDianping) {
      setShowDianping(true)
    }
  }, [dianpingRanking])

  const badges = useMemo(() => {
    const b: Record<string, boolean> = {}
    const totalNeeded = calculateTotalNeededIngredients(channelOrderForecasts, isFranchisePeriod)
    for (const [type, needed] of Object.entries(totalNeeded)) {
      if (!needed || needed <= 0) continue
      const have = inventory.filter(i => i.type === type).reduce((s, i) => s + i.quantity, 0)
      if (have < needed) { b.procurement = true; break }
    }
    const lowMoodEmp = employees.find(e => e.mood <= 30)
    if (lowMoodEmp) b.personnel = true
    const hasAppealable = reviews.find(r => !r.isPositive && r.canAppeal && !r.isAppealed)
    if (hasAppealable) b.orders = true
    if (SUMMER_MONTHS.includes(gameTime.month)) {
      const brokenFurniture = shop.furniture.find(f => {
        const cfg = FURNITURE_CONFIG_MAP.get(f.type)
        return cfg && cfg.breakRate > 0 && f.count > 0
      })
      if (brokenFurniture) b.furniture = true
    }
    return b
  }, [channelOrderForecasts, isFranchisePeriod, inventory, employees, reviews, gameTime.month, shop.furniture])

  useEffect(() => {
    notifications.forEach((_, i) => {
      if (!timerRef.current.has(i)) {
        timerRef.current.set(i, setTimeout(() => {
          dispatch({ type: 'DISMISS_NOTIFICATION', payload: { index: i } })
          timerRef.current.delete(i)
        }, 4000))
      }
    })

    for (const key of timerRef.current.keys()) {
      if (key >= notifications.length) {
        clearTimeout(timerRef.current.get(key))
        timerRef.current.delete(key)
      }
    }
  }, [notifications, dispatch])

  return (
    <div className="game-layout">
      <div className="status-bar">
        <span className="shop-name">🍗 {shopName || '鸡架'}鸡架店</span>
        <div className="stat-group">
          <span className="stat-item">
            <span className="stat-label">💰</span>
            <span className="stat-value">{fmtMoney(cash)}元</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">📅</span>
            <span className="stat-value">第{gameTime.year}年{gameTime.month}月第{gameTime.week}周</span>
          </span>
          <span className="stat-item" style={{ minWidth: 120 }}>
            <span className="stat-label">⚡</span>
            <ProgressBar value={stamina.current} max={stamina.max} color={stamina.current <= 2 ? 'red' : 'green'} />
          </span>
          {currentTitle && (
            <span className="stat-item">
              <span className="status-badge success">{currentTitle}</span>
            </span>
          )}
          {state.activeLoans.length > 0 && (
            <span className="stat-item">
              <span className="status-badge warning">💳 待还{state.activeLoans.length}笔借款</span>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => dispatch({ type: 'ADVANCE_WEEK' })}
          >
            推进下周 ▶
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => dispatch({ type: 'SAVE_GAME', payload: { slot: 0 } })}
          >
            💾 存档
          </button>
        </div>
      </div>

      <div className="game-body">
        <nav className="sidebar">
          <ul className="sidebar-menu">
            {MENU_ITEMS.map(item => (
              <li
                key={item.key}
                className={activeScreen === item.key ? 'active' : ''}
                onClick={() => {
                  setActiveScreen(item.key)
                  dispatch({ type: 'SET_WEEK_PHASE', payload: item.phase })
                }}
                style={{ position: 'relative' }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {badges[item.key] && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#e74c3c',
                  }} />
                )}
              </li>
            ))}
            {EXTRA_ITEMS.map(item => (
              <li
                key={item.key}
                className={activeScreen === item.key ? 'active' : ''}
                style={item.key === 'private_domain' ? { borderTop: '2px solid var(--color-gold-dark)', marginTop: '4px', paddingTop: '10px' } : undefined}
                onClick={() => {
                  setActiveScreen(item.key)
                  dispatch({ type: 'SET_WEEK_PHASE', payload: 'advance' })
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <main className="main-content">
          {state.activeLoans.length > 0 && (
            <div className="card" style={{ marginBottom: '12px', border: '2px solid #e8a735' }}>
              <div className="card-title" style={{ color: '#e8a735' }}>💳 待还借款</div>
              {state.activeLoans.map((loan, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontFamily: 'var(--pixel-font)', fontSize: '12px' }}>
                  <span>{loan.source}借款 {fmtMoney(loan.amount)}元（第{loan.dueWeek}周到期，还剩{loan.dueWeek - state.absoluteWeek}周）</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'REPAY_LOAN', payload: { loanIndex: i } })}>
                    偿还{fmtMoney(loan.amount)}元
                  </button>
                </div>
              ))}
            </div>
          )}
          {badges[activeScreen] && (
            <div style={{
              marginBottom: '12px', padding: '10px 14px',
              background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
              borderRadius: '8px', border: '1px solid #f0c040',
              fontFamily: 'var(--pixel-font)', fontSize: '12px', color: '#856404',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>💡</span>
              <span>
                {activeScreen === 'procurement' && '库存不足以满足本周订单需求，请及时采购原料！'}
                {activeScreen === 'personnel' && '有员工心情低落，建议进行谈心沟通，避免员工离职！'}
                {activeScreen === 'orders' && '有待申诉的差评，及时申诉可挽回店铺评分！'}
                {activeScreen === 'furniture' && '有设备损坏，请及时维修以免影响经营！'}
              </span>
            </div>
          )}
          {renderSubScreen(activeScreen)}
        </main>
      </div>

      {notifications.length > 0 && (
        <div className="notification-container">
          {notifications.map((msg, i) => (
            <div key={i} className="notification-toast">
              <span>{msg}</span>
              <button className="dismiss-btn" onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: { index: i } })}>✕</button>
            </div>
          ))}
        </div>
      )}

      {!state.tutorialDismissed && absoluteWeek <= 2 && (
        <TutorialGuide onDismiss={() => dispatch({ type: 'DISMISS_TUTORIAL' })} />
      )}

      {showDianping && dianpingRanking && (
        <DianpingPopup
          ranking={dianpingRanking}
          playerRank={dianpingRank}
          onConfirm={() => setShowDianping(false)}
        />
      )}

      {!state.talentSubsidyShown && absoluteWeek >= 2 && (
        <TalentSubsidyPopup onConfirm={() => dispatch({ type: 'DISMISS_TALENT_SUBSIDY' })} />
      )}
    </div>
  )
}
