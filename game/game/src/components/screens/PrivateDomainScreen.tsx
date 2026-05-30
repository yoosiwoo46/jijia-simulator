import { useGame } from '../../core/GameContext'
import { PRIVATE_DOMAIN_CHANNEL_NAMES } from '../../core/constants'
import type { PrivateDomainStrategy } from '../../types'
import Button from '../ui/Button'
import StatusBadge from '../ui/StatusBadge'

const STRATEGY_OPTIONS: { value: PrivateDomainStrategy; label: string; description: string }[] = [
  { value: 'new_product', label: '新品推广', description: '默认策略，无额外加成' },
  { value: 'discount', label: '折扣促销', description: '订单+20%，单笔收入-10%' },
  { value: 'membership', label: '会员运营', description: '粉丝增长率+10%' },
  { value: 'feedback', label: '反馈收集', description: '品牌知名度+5/周' },
]

export default function PrivateDomainScreen() {
  const { state, dispatch } = useGame()
  const { privateDomains, employees } = state

  const speechEmployees = employees.filter(e => e.skills.speechcraft >= 7)

  return (
    <div>
      <h2 className="screen-title">💬 私域运营</h2>

      {privateDomains.map(pd => {
        const channelName = PRIVATE_DOMAIN_CHANNEL_NAMES[pd.channel]
        const estimatedOrders = pd.isActive ? Math.floor(pd.followerCount * 0.05) : 0

        return (
          <div key={pd.channel} className="platform-card">
            <div className="platform-header">
              <span className="platform-name">{channelName}</span>
              <StatusBadge status={pd.isActive ? 'success' : 'normal'} text={pd.isActive ? '运营中' : '未开启'} />
            </div>

            <div className="platform-detail">粉丝数：{pd.followerCount}人</div>
            {pd.isActive && (
              <div className="platform-detail">预估周订单：{estimatedOrders}份</div>
            )}

            <div className="platform-actions">
              <Button
                variant={pd.isActive ? 'danger' : 'primary'}
                size="sm"
                onClick={() => dispatch({ type: 'ACTIVATE_PRIVATE_DOMAIN', payload: { channel: pd.channel } })}
              >
                {pd.isActive ? '暂停运营' : '开启运营'}
              </Button>
              {!pd.isActive && (
                <span className="cost-hint" style={{ fontSize: '11px', marginLeft: '8px' }}>消耗体力：1点</span>
              )}

              {pd.isActive && (
              <div className="form-group" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ margin: 0, fontSize: '11px' }}>委托员工：</label>
                <select
                  value={pd.delegatedEmployeeId ?? ''}
                  onChange={e => dispatch({
                    type: 'DELEGATE_PRIVATE_DOMAIN',
                    payload: { channel: pd.channel, employeeId: e.target.value || null },
                  })}
                  style={{ width: 'auto', padding: '3px 6px', fontSize: '11px' }}
                >
                  <option value="">自行管理</option>
                  {speechEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}（口才{emp.skills.speechcraft}）</option>
                  ))}
                </select>
              </div>
            )}

            {pd.isActive && (
              <div className="form-group" style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ margin: 0, fontSize: '11px' }}>运营策略：</label>
                <select
                  value={pd.strategy}
                  onChange={e => dispatch({
                    type: 'SET_PRIVATE_DOMAIN_STRATEGY',
                    payload: { channel: pd.channel, strategy: e.target.value as PrivateDomainStrategy },
                  })}
                  style={{ width: 'auto', padding: '3px 6px', fontSize: '11px' }}
                >
                  {STRATEGY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                  ))}
                </select>
              </div>
            )}
            </div>

            {pd.isDelegated && pd.delegatedEmployeeId && (
              <div className="text-sm mt-8">
                已委托给：{employees.find(e => e.id === pd.delegatedEmployeeId)?.name ?? '未知'}
                <div className="text-gray text-sm">
                  口才≥9：订单增加15%-25% | 口才&lt;7：25%概率掉粉
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
