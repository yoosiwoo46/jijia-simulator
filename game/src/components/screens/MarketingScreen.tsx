import { useGame } from '../../core/GameContext'
import { MARKETING_INVESTMENT_PER_WEEK, EVENT_SCHEDULES } from '../../core/constants'
import { fmtMoney } from '../../utils/format'
import Button from '../ui/Button'
import StatusBadge from '../ui/StatusBadge'

const MAJOR_EVENT_TYPES = ['world_cup', 'euro_cup', 'lol_worlds']

export default function MarketingScreen() {
  const { state, dispatch } = useGame()
  const { marketingEvents, stamina, platforms, lastWeekEventMerchSold } = state

  const canPlan = stamina.current >= 1
  const activeEvents = marketingEvents.filter(e => e.isActive)
  const hasMajorEvent = activeEvents.some(e => MAJOR_EVENT_TYPES.includes(e.type))
  const bonusMultiplier = hasMajorEvent ? 15 : 5
  const lastWeekBonus = lastWeekEventMerchSold * bonusMultiplier

  return (
    <div>
      <h2 className="screen-title">🎉 营销活动</h2>

      <div className="card mb-12">
        <div className="card-title">策划营销</div>
        <div className="cost-hint mb-8">
          消耗体力：<span className="cost-value">1点</span>
        </div>
        <Button
          variant="primary"
          disabled={!canPlan}
          onClick={() => dispatch({ type: 'PLAN_MARKETING' })}
        >
          策划下周营销
        </Button>
      </div>

      {activeEvents.length > 0 && (
        <div className="card mb-12">
          <div className="card-title">当前活动</div>
          {activeEvents.map(event => (
            <div key={event.type} className="employee-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="employee-name">{event.name}</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <StatusBadge status="success" text="进行中" />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => dispatch({ type: 'STOP_MARKETING', payload: { eventType: event.type } })}
                  >
                    终止营销
                  </Button>
                  {['world_cup', 'euro_cup', 'lol_worlds', 'champions_league'].includes(event.type) && (
                    <Button
                      variant={state.watchPartyActive && state.watchPartyEvent === event.type ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => dispatch({ type: 'TOGGLE_WATCH_PARTY', payload: { eventType: event.type } })}
                    >
                      {state.watchPartyActive && state.watchPartyEvent === event.type ? '关闭观赛' : '到店观赛'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '8px', padding: '8px', background: 'var(--color-gray-100, #f5f5f5)', borderRadius: '4px', fontSize: '13px' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>活动营销增益公式：</strong>
              售出活动周边 × {bonusMultiplier}元
              {hasMajorEvent && <span style={{ color: 'var(--color-danger, #e53e3e)' }}>（大赛加成）</span>}
            </div>
            <div style={{ color: 'var(--color-gray-500, #999)', fontSize: '12px' }}>
              需在采购中购买「活动周边」才能触发增益
            </div>
          </div>
        </div>
      )}

      {lastWeekEventMerchSold > 0 && (
        <div className="card mb-12">
          <div className="card-title">上周活动营销收益</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <span style={{ fontSize: '13px' }}>售出活动周边</span>
            <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px' }}>×{lastWeekEventMerchSold}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <span style={{ fontSize: '13px' }}>增益倍率</span>
            <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px' }}>×{bonusMultiplier}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--color-gray-200)', marginTop: '4px', paddingTop: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>额外收入</span>
            <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '14px', color: 'var(--color-success, #38a169)' }}>+{fmtMoney(lastWeekBonus)}元</span>
          </div>
        </div>
      )}

      <div className="card mb-12">
        <div className="card-title">赛事日历</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>赛事</th>
              <th>月份</th>
              <th>频率</th>
              <th>效果</th>
            </tr>
          </thead>
          <tbody>
            {EVENT_SCHEDULES.map(event => {
              const effectLabel = event.effect === 'massive' ? '爆发' : event.effect === 'peak' ? '高峰' : '稳定'
              const effectStatus = event.effect === 'massive' ? 'danger' : event.effect === 'peak' ? 'warning' : 'normal'
              const monthStr = event.periodMonths ? `${event.periodMonths.join('、')}月` : '-'
              return (
                <tr key={event.type}>
                  <td>{event.name}</td>
                  <td>{monthStr}</td>
                  <td>每周{event.frequencyPerWeek}次</td>
                  <td>
                    <StatusBadge status={effectStatus} text={effectLabel} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-title">平台投放</div>
        {platforms.filter(p => p.isJoined).map(platform => (
          <div key={platform.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-gray-200)' }}>
            <span style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px' }}>{platform.name}</span>
            <div className="inline-flex">
              <span className="text-sm text-gray mr-8">
                {platform.marketingActive ? `投放中（${fmtMoney(MARKETING_INVESTMENT_PER_WEEK)}元/周）` : '未投放'}
              </span>
              <Button
                variant={platform.marketingActive ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => dispatch({ type: 'TOGGLE_PLATFORM_MARKETING', payload: { platformId: platform.id } })}
              >
                {platform.marketingActive ? '停止投放' : '开始投放'}
              </Button>
            </div>
          </div>
        ))}
        {platforms.filter(p => p.isJoined).length === 0 && (
          <p className="text-gray text-sm">请先入驻外卖平台</p>
        )}
      </div>
    </div>
  )
}
