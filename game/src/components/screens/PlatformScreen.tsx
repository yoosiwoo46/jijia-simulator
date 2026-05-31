import { useGame } from '../../core/GameContext'
import { CANCELLED_ORDER_THRESHOLD, PLATFORM_ACTIVITY_CONFIGS, SKU_CONFIGS } from '../../core/constants'
import { fmtMoney } from '../../utils/format'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import StatusBadge from '../ui/StatusBadge'

export default function PlatformScreen() {
  const { state, dispatch } = useGame()
  const { platforms, cash, stamina, isFranchisePeriod, enabledSkus } = state

  const nonEventSkus = SKU_CONFIGS.filter(s => !s.isEventOnly)

  return (
    <div>
      <h2 className="screen-title">📱 外卖平台</h2>

      <div className="platform-card" style={{ marginBottom: '12px' }}>
        <div className="platform-header">
          <span className="platform-name">📦 SKU管理</span>
          <StatusBadge status={isFranchisePeriod ? 'normal' : 'success'} text={isFranchisePeriod ? '加盟期（需总部审批）' : '独立经营（自由管理）'} />
        </div>
        {isFranchisePeriod && (
          <div className="text-sm text-gray" style={{ marginBottom: '8px' }}>
            加盟期间调整SKU需与总部沟通，消耗体力1点，总部有50%概率不理睬
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {nonEventSkus.map(sku => {
            const isEnabled = enabledSkus.includes(sku.id)
            const typeLabel: Record<string, string> = { main: '主食', side: '配菜', drink: '饮品', combo: '套餐' }
            return (
              <Button
                key={sku.id}
                variant={isEnabled ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => dispatch({
                  type: isFranchisePeriod ? 'TOGGLE_SKU_FRANCHISE' : 'TOGGLE_SKU_INDEPENDENT',
                  payload: { skuId: sku.id },
                })}
              >
                {isEnabled ? '✅' : '❌'} {sku.name}({typeLabel[sku.type] || sku.type}) ¥{sku.price}
              </Button>
            )
          })}
        </div>
      </div>

      {platforms.map(platform => {
        const activity = PLATFORM_ACTIVITY_CONFIGS.find(a => a.platformId === platform.id)
        const canJoin = cash >= platform.deposit && stamina.current >= 1

        return (
          <div key={platform.id} className="platform-card">
            <div className="platform-header">
              <span className="platform-name">{platform.name}</span>
              {platform.isJoined ? (
                <StatusBadge status={platform.isSuspended ? 'danger' : 'success'} text={platform.isSuspended ? '已暂停' : '已入驻'} />
              ) : (
                <StatusBadge status="normal" text="未入驻" />
              )}
            </div>

            <div className="platform-detail">保证金：{fmtMoney(platform.deposit)}元</div>
            <div className="platform-detail">当前评分：{platform.rating.toFixed(1)}</div>

            {platform.isJoined && (
              <>
                <div className="platform-detail">
                  取消订单：{platform.cancelledOrders}/{CANCELLED_ORDER_THRESHOLD}
                </div>
                <ProgressBar
                  value={platform.cancelledOrders}
                  max={CANCELLED_ORDER_THRESHOLD}
                  color={platform.cancelledOrders >= 40 ? 'red' : 'orange'}
                />
                {platform.isSuspended && (
                  <div className="text-red text-sm mt-8">
                    ⚠️ 已暂停，剩余{platform.suspensionWeeksLeft}周
                  </div>
                )}
                {activity && (
                  <div className="platform-detail mt-8">
                    🎯 活动：{activity.name} — {activity.effect}
                  </div>
                )}
              </>
            )}

            <div className="platform-actions">
              <div className="text-sm text-gray mb-8">消耗体力：1点</div>
              {!platform.isJoined ? (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canJoin}
                  onClick={() => dispatch({ type: 'JOIN_PLATFORM', payload: { platformId: platform.id } })}
                >
                  入驻（{fmtMoney(platform.deposit)}元）
                </Button>
              ) : (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => dispatch({ type: 'LEAVE_PLATFORM', payload: { platformId: platform.id } })}
                  >
                    退出平台
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_DELIVERY_METHOD', payload: { platformId: platform.id, method: platform.deliveryMethod === 'platform_rider' ? 'self_delivery' : 'platform_rider' } })}
                  >
                    {platform.deliveryMethod === 'platform_rider' ? '切换自配送' : '切换平台骑手'}
                  </Button>
                  <Button
                    variant={platform.marketingActive ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => dispatch({ type: 'TOGGLE_PLATFORM_MARKETING', payload: { platformId: platform.id } })}
                  >
                    {platform.marketingActive ? '关闭用增' : '用增达人'}
                  </Button>
                  <Button
                    variant={platform.isDelegated ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => dispatch({ type: 'TOGGLE_PLATFORM_DELEGATION', payload: { platformId: platform.id } })}
                  >
                    {platform.isDelegated ? '取消托管' : '托管总部'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
