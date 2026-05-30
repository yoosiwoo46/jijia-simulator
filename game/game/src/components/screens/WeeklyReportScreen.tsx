import { useState } from 'react'
import { useGame } from '../../core/GameContext'
import StatCard from '../ui/StatCard'
import StatusBadge from '../ui/StatusBadge'
import { CHANNEL_LABELS, INGREDIENT_CONFIG_MAP, FURNITURE_CONFIG_MAP } from '../../core/constants'
import { fmtMoney } from '../../utils/format'

export default function WeeklyReportScreen() {
  const { state } = useGame()
  const { lastWeekSales, weeklyRevenue, weeklyExpenses, reviews, notifications,
    totalRevenue, totalExpenses, cash, activeLoans, weeklyExpensesDetail, monthlyExpensesDetail,
    inventory, shop, employees, activeLoans: loans } = state
  const netProfit = weeklyRevenue - weeklyExpenses
  const totalNetProfit = totalRevenue - totalExpenses

  const [showRevenueDetail, setShowRevenueDetail] = useState(false)
  const [showExpenseDetail, setShowExpenseDetail] = useState(false)
  const [showBalanceSheet, setShowBalanceSheet] = useState(false)
  const [showCashFlow, setShowCashFlow] = useState(false)
  const [showIncomeStatement, setShowIncomeStatement] = useState(false)

  const totalOrders = lastWeekSales.reduce((s, c) => s + (c.fulfilledOrders || 0), 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(weeklyRevenue / totalOrders) : 0

  const badReviewByChannel: Record<string, { total: number; bad: number }> = {}
  for (const review of reviews) {
    if (!badReviewByChannel[review.channel]) {
      badReviewByChannel[review.channel] = { total: 0, bad: 0 }
    }
    badReviewByChannel[review.channel].total += 1
    if (!review.isPositive) {
      badReviewByChannel[review.channel].bad += 1
    }
  }

  const inventoryValue = inventory.reduce((sum, item) => {
    const cfg = INGREDIENT_CONFIG_MAP.get(item.type)
    if (!cfg) return sum
    const price = cfg.officialPrice ?? (cfg.otherPriceRange ? cfg.otherPriceRange[0] : 0)
    return sum + price * item.quantity
  }, 0)

  const fixedAssetsValue = shop.furniture.reduce((sum, f) => {
    const cfg = FURNITURE_CONFIG_MAP.get(f.type)
    return sum + (cfg ? cfg.price * f.count : 0)
  }, 0)

  const totalLiabilities = loans.reduce((sum, l) => sum + l.amount, 0)
  const totalAssets = cash + inventoryValue + fixedAssetsValue
  const ownerEquity = totalAssets - totalLiabilities

  return (
    <div>
      <h2 className="screen-title">📊 经营数据</h2>

      <div className="card">
        <div className="card-title" style={{ fontSize: '14px', color: 'var(--color-gold)' }}>本周数据</div>
        <div className="stat-grid mb-12">
          <StatCard icon="💰" label="本周营收" value={`${fmtMoney(weeklyRevenue)}元`} />
          <StatCard icon="💸" label="本周支出" value={`${fmtMoney(weeklyExpenses)}元`} />
          <StatCard
            icon={netProfit >= 0 ? '📈' : '📉'}
            label="本周净利润"
            value={`${fmtMoney(netProfit)}元`}
            subtitle={netProfit >= 0 ? '盈利' : '亏损'}
          />
          <StatCard icon="📦" label="完成订单" value={`${totalOrders}份`} />
          <StatCard icon="💵" label="客单价" value={`${fmtMoney(avgOrderValue)}元`} />
        </div>

        <div className="card-title" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setShowRevenueDetail(!showRevenueDetail)}>
          💰 本周收入明细 {showRevenueDetail ? '▼' : '▶'}
        </div>
        {showRevenueDetail && (
          lastWeekSales.length === 0 ? (
            <p className="text-gray text-sm">暂无数据</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>完成单量</th>
                  <th>总收入</th>
                  <th>单均价格</th>
                  <th>差评率</th>
                </tr>
              </thead>
              <tbody>
                {lastWeekSales.map((sale, i) => {
                  const channelLabel = CHANNEL_LABELS[sale.channel] || sale.channel
                  const fulfilled = sale.fulfilledOrders || 0
                  const avgRev = fulfilled > 0 ? Math.round(sale.revenue / fulfilled) : 0
                  const reviewInfo = badReviewByChannel[sale.channel]
                  const badRate = reviewInfo && reviewInfo.total > 0
                    ? Math.round((reviewInfo.bad / reviewInfo.total) * 100)
                    : 0

                  return (
                    <tr key={i}>
                      <td>{channelLabel}</td>
                      <td>{fulfilled}份</td>
                      <td>{fmtMoney(sale.revenue)}元</td>
                      <td>{fmtMoney(avgRev)}元</td>
                      <td>
                        {!reviewInfo ? (
                          <span className="text-gray">-</span>
                        ) : (
                          <StatusBadge
                            status={badRate > 30 ? 'danger' : badRate > 15 ? 'warning' : 'success'}
                            text={`${badRate}%`}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}

        <div className="card-title" style={{ cursor: 'pointer', fontSize: '12px', marginTop: '12px' }} onClick={() => setShowExpenseDetail(!showExpenseDetail)}>
          💸 本周支出明细 {showExpenseDetail ? '▼' : '▶'}
        </div>
        {showExpenseDetail && (
          weeklyExpensesDetail.length === 0 && monthlyExpensesDetail.length === 0 ? (
            <p className="text-gray text-sm">暂无数据</p>
          ) : (
            <>
              {weeklyExpensesDetail.length > 0 && (
                <table className="data-table">
                  <thead><tr><th>本周支出</th><th>金额</th></tr></thead>
                  <tbody>
                    {weeklyExpensesDetail.map((item, i) => (
                      <tr key={`w${i}`}><td>{item.item}</td><td>{fmtMoney(item.amount)}元</td></tr>
                    ))}
                    <tr style={{ fontWeight: 'bold' }}>
                      <td>本周小计</td><td>{fmtMoney(weeklyExpensesDetail.reduce((s, i) => s + i.amount, 0))}元</td>
                    </tr>
                  </tbody>
                </table>
              )}
              {monthlyExpensesDetail.length > 0 && (
                <table className="data-table" style={{ marginTop: '8px' }}>
                  <thead><tr><th>月度固定支出</th><th>金额</th></tr></thead>
                  <tbody>
                    {monthlyExpensesDetail.map((item, i) => (
                      <tr key={`m${i}`}><td>{item.item}</td><td>{fmtMoney(item.amount)}元</td></tr>
                    ))}
                    <tr style={{ fontWeight: 'bold' }}>
                      <td>月度小计</td><td>{fmtMoney(monthlyExpensesDetail.reduce((s, i) => s + i.amount, 0))}元</td>
                    </tr>
                  </tbody>
                </table>
              )}
              <table className="data-table" style={{ marginTop: '8px' }}>
                <tbody>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td>合计</td><td>{fmtMoney(weeklyExpenses)}元</td>
                  </tr>
                </tbody>
              </table>
            </>
          )
        )}
      </div>

      <div className="card">
        <div className="card-title" style={{ fontSize: '14px', color: 'var(--color-gold)' }}>累计数据</div>
        <div className="stat-grid">
          <StatCard icon="📊" label="累计营收" value={`${fmtMoney(totalRevenue)}元`} />
          <StatCard icon="📉" label="累计支出" value={`${fmtMoney(totalExpenses)}元`} />
          <StatCard
            icon={totalNetProfit >= 0 ? '✅' : '⚠️'}
            label="累计净利润"
            value={`${fmtMoney(totalNetProfit)}元`}
          />
          <StatCard icon="🏦" label="当前余额" value={`${fmtMoney(cash)}元`} />
        </div>

        {activeLoans.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div className="card-title" style={{ fontSize: '12px' }}>待还借款</div>
            <table className="data-table">
              <thead>
                <tr><th>来源</th><th>金额</th><th>到期周</th></tr>
              </thead>
              <tbody>
                {activeLoans.map((loan, i) => (
                  <tr key={i}>
                    <td>{loan.source}</td>
                    <td>{fmtMoney(loan.amount)}元</td>
                    <td>第{loan.dueWeek}周</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title" style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--color-gold)' }} onClick={() => setShowBalanceSheet(!showBalanceSheet)}>
          📋 资产负债表 {showBalanceSheet ? '▼' : '▶'}
        </div>
        {showBalanceSheet && (
          <table className="data-table">
            <thead><tr><th>项目</th><th>金额</th></tr></thead>
            <tbody>
              <tr><td>现金</td><td>{fmtMoney(cash)}元</td></tr>
              <tr><td>存货价值</td><td>{fmtMoney(inventoryValue)}元</td></tr>
              <tr><td>固定资产</td><td>{fmtMoney(fixedAssetsValue)}元</td></tr>
              <tr style={{ fontWeight: 'bold' }}><td>资产合计</td><td>{fmtMoney(totalAssets)}元</td></tr>
              <tr><td colSpan={2} style={{ height: '8px' }}></td></tr>
              <tr><td>借款负债</td><td>{fmtMoney(totalLiabilities)}元</td></tr>
              <tr style={{ fontWeight: 'bold' }}><td>负债合计</td><td>{fmtMoney(totalLiabilities)}元</td></tr>
              <tr><td colSpan={2} style={{ height: '8px' }}></td></tr>
              <tr style={{ fontWeight: 'bold' }}><td>所有者权益</td><td>{fmtMoney(ownerEquity)}元</td></tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-title" style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--color-gold)' }} onClick={() => setShowCashFlow(!showCashFlow)}>
          💰 现金流量表 {showCashFlow ? '▼' : '▶'}
        </div>
        {showCashFlow && (
          <table className="data-table">
            <thead><tr><th>项目</th><th>金额</th></tr></thead>
            <tbody>
              <tr><td>经营活动现金流入（营收）</td><td>{fmtMoney(totalRevenue)}元</td></tr>
              <tr><td>经营活动现金流出（支出）</td><td>{fmtMoney(totalExpenses)}元</td></tr>
              <tr style={{ fontWeight: 'bold' }}><td>经营活动净现金流</td><td>{fmtMoney(totalRevenue - totalExpenses)}元</td></tr>
              <tr><td colSpan={2} style={{ height: '8px' }}></td></tr>
              <tr><td>借款收到现金</td><td>{totalLiabilities > 0 ? fmtMoney(totalLiabilities) : '0'}元</td></tr>
              <tr style={{ fontWeight: 'bold' }}><td>期末现金余额</td><td>{fmtMoney(cash)}元</td></tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-title" style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--color-gold)' }} onClick={() => setShowIncomeStatement(!showIncomeStatement)}>
          📈 利润表 {showIncomeStatement ? '▼' : '▶'}
        </div>
        {showIncomeStatement && (
          <table className="data-table">
            <thead><tr><th>项目</th><th>金额</th></tr></thead>
            <tbody>
              <tr style={{ fontWeight: 'bold' }}><td>累计营业收入</td><td>{fmtMoney(totalRevenue)}元</td></tr>
              <tr><td>减：累计营业成本（支出）</td><td>{fmtMoney(totalExpenses)}元</td></tr>
              <tr style={{ fontWeight: 'bold', color: totalNetProfit >= 0 ? 'green' : 'red' }}>
                <td>累计净利润</td><td>{fmtMoney(totalNetProfit)}元</td>
              </tr>
              <tr><td colSpan={2} style={{ height: '8px' }}></td></tr>
              <tr><td>本周营业收入</td><td>{fmtMoney(weeklyRevenue)}元</td></tr>
              <tr><td>减：本周营业成本</td><td>{fmtMoney(weeklyExpenses)}元</td></tr>
              <tr style={{ fontWeight: 'bold', color: netProfit >= 0 ? 'green' : 'red' }}>
                <td>本周净利润</td><td>{fmtMoney(netProfit)}元</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="card">
          <div className="card-title">本周事件</div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {notifications.map((msg, i) => (
              <li key={i} style={{ padding: '4px 0', fontFamily: 'var(--pixel-font)', fontSize: '12px' }}>
                📢 {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
