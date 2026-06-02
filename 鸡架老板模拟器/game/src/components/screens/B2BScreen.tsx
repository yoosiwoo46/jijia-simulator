import { useGame } from '../../core/GameContext'
import { B2B_RELATION_CONFIGS, B2B_DELIVERY_FEE_PER_MERCHANT } from '../../core/constants'
import { fmtMoney } from '../../utils/format'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import StatusBadge from '../ui/StatusBadge'

const RELATION_LABELS: Record<string, string> = {
  stranger: '陌生',
  normal: '普通',
  friendly: '友好',
  intimate: '亲密',
  strategic: '战略',
}

const GRADE_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export default function B2BScreen() {
  const { state, dispatch } = useGame()
  const { b2bMerchants, absoluteWeek } = state

  const unlockedMerchants = b2bMerchants.filter(m => m.unlockWeek <= absoluteWeek)
  const activeMerchants = unlockedMerchants.filter(m => m.isActive)
  const availableToSign = unlockedMerchants.filter(m => !m.isActive && m.cooldownWeeksLeft === 0)
  const cooldownMerchants = unlockedMerchants.filter(m => !m.isActive && m.cooldownWeeksLeft > 0)

  return (
    <div>
      <h2 className="screen-title">🏢 B端客户</h2>

      {availableToSign.length > 0 && (
        <div className="card mb-12">
          <div className="card-title">可签约商户</div>
          {availableToSign.map(merchant => (
            <div key={merchant.type} className="employee-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="employee-name">{merchant.name}</span>
              </div>
              <div className="employee-detail">周订单：{merchant.minWeeklyOrders}-{merchant.maxWeeklyOrders}份</div>
              <div className="employee-detail">单价：{fmtMoney(merchant.unitPrice)}元/份</div>
              <div className="employee-detail">配送费：{fmtMoney(B2B_DELIVERY_FEE_PER_MERCHANT)}元/周</div>
              <div className="mt-8">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => dispatch({ type: 'SIGN_B2B_CONTRACT', payload: { merchantType: merchant.type } })}
                >
                  签约
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMerchants.length > 0 && (
        <div className="card">
          <div className="card-title">活跃商户</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>商户</th>
                <th>等级</th>
                <th>关系</th>
                <th>周订单</th>
                <th>单价</th>
                <th>违约</th>
                <th>下周预估</th>
              </tr>
            </thead>
            <tbody>
              {activeMerchants.map(merchant => {
                const relationCfg = B2B_RELATION_CONFIGS.find(c => c.level === merchant.relationLevel)
                const priceWithRelation = merchant.unitPrice * (1 + (relationCfg?.priceModifier ?? 0))
                return (
                  <tr key={merchant.type}>
                    <td>{merchant.name}</td>
                    <td>
                      <StatusBadge
                        status={merchant.grade === 'high' ? 'success' : merchant.grade === 'medium' ? 'normal' : 'warning'}
                        text={GRADE_LABELS[merchant.grade] ?? merchant.grade}
                      />
                    </td>
                    <td>
                      <StatusBadge
                        status={merchant.relationLevel === 'strategic' ? 'success' : merchant.relationLevel === 'intimate' ? 'success' : merchant.relationLevel === 'friendly' ? 'normal' : 'warning'}
                        text={RELATION_LABELS[merchant.relationLevel] ?? merchant.relationLevel}
                      />
                    </td>
                    <td>{merchant.currentWeekOrders}份</td>
                    <td>{fmtMoney(priceWithRelation)}元</td>
                    <td>
                      {merchant.breachCount > 0 ? (
                        <StatusBadge status="danger" text={`${merchant.breachCount}次`} />
                      ) : (
                        <span className="text-gray text-sm">无</span>
                      )}
                    </td>
                    <td>{merchant.minWeeklyOrders}-{merchant.maxWeeklyOrders}份</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-12">
            <div className="card-title">关系进度</div>
            {activeMerchants.map(merchant => {
              const nextLevel = B2B_RELATION_CONFIGS.find(c =>
                B2B_RELATION_CONFIGS.indexOf(c) > B2B_RELATION_CONFIGS.findIndex(r => r.level === merchant.relationLevel)
              )
              return (
                <div key={merchant.type} style={{ marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{merchant.name}</span>
                    <span>{RELATION_LABELS[merchant.relationLevel]} → {nextLevel ? RELATION_LABELS[nextLevel.level] : '已满级'}</span>
                  </div>
                  <ProgressBar
                    value={merchant.fulfilledCount}
                    max={nextLevel?.fulfilledThreshold ?? merchant.fulfilledCount}
                    color="gold"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {cooldownMerchants.length > 0 && (
        <div className="card">
          <div className="card-title">冷却中</div>
          {cooldownMerchants.map(merchant => (
            <div key={merchant.type} className="employee-card" style={{ opacity: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="employee-name">{merchant.name}</span>
                <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '11px', color: '#e67e22' }}>
                  冷却{merchant.cooldownWeeksLeft}周
                </span>
              </div>
              <div className="employee-detail">周订单：{merchant.minWeeklyOrders}-{merchant.maxWeeklyOrders}份</div>
              <div className="employee-detail">单价：{fmtMoney(merchant.unitPrice)}元/份</div>
            </div>
          ))}
        </div>
      )}

      {unlockedMerchants.length === 0 && (
        <div className="card">
          <p className="text-gray text-sm">尚未解锁任何B端商户，继续经营即可解锁</p>
        </div>
      )}
    </div>
  )
}
