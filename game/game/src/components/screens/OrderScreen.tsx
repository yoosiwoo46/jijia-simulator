import { useGame } from '../../core/GameContext'
import { CANCELLED_ORDER_THRESHOLD } from '../../core/constants'
import { fmtMoney } from '../../utils/format'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'

const CHANNEL_DISPLAY_NAMES: Record<string, string> = {
  b2b: 'B端供货',
  mt: 'MT外卖',
  sg: 'SG外卖',
  jd: 'JD外卖',
  offline: '线下到店',
  private_domain: '私域运营',
}

export default function OrderScreen() {
  const { state, dispatch } = useGame()
  const { lastWeekSales, reviews, cancelledOrdersByChannel, stamina } = state

  const appealableReviews = reviews.filter(r => !r.isPositive && r.canAppeal && !r.isAppealed)

  return (
    <div>
      <h2 className="screen-title">📋 订单系统</h2>

      <div className="card">
        <div className="card-title">上周订单统计</div>
        {lastWeekSales.length === 0 ? (
          <p className="text-gray text-sm">暂无订单数据</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>渠道</th>
                <th>订单数</th>
                <th>营收</th>
              </tr>
            </thead>
            <tbody>
              {lastWeekSales.map((sale, i) => (
                <tr key={i}>
                  <td>{CHANNEL_DISPLAY_NAMES[sale.channel] ?? sale.channel}</td>
                  <td>{sale.fulfilledOrders}份</td>
                  <td>{fmtMoney(sale.revenue)}元</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-title">取消订单警告</div>
        {Object.keys(cancelledOrdersByChannel).length === 0 ? (
          <p className="text-gray text-sm">暂无取消订单</p>
        ) : (
          Object.entries(cancelledOrdersByChannel).map(([channel, count]) => (
            <div key={channel} style={{ marginBottom: '8px' }}>
              <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{CHANNEL_DISPLAY_NAMES[channel] ?? channel}</span>
                <span className={count >= CANCELLED_ORDER_THRESHOLD * 0.8 ? 'text-red text-bold' : ''}>{count}/{CANCELLED_ORDER_THRESHOLD}</span>
              </div>
              <ProgressBar
                value={count}
                max={CANCELLED_ORDER_THRESHOLD}
                color={count >= CANCELLED_ORDER_THRESHOLD * 0.8 ? 'red' : 'orange'}
              />
              {count >= CANCELLED_ORDER_THRESHOLD * 0.8 && (
                <div className="text-red text-sm">⚠️ 即将达到暂停阈值！</div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-title">差评申诉</div>
        {appealableReviews.length === 0 ? (
          <p className="text-gray text-sm">暂无可申诉的差评</p>
        ) : (
          <>
            <div style={{ marginBottom: '12px' }}>
              <Button
                variant="primary"
                size="sm"
                disabled={stamina.current < 1}
                onClick={() => dispatch({ type: 'APPEAL_ALL_REVIEWS' })}
              >
                一键申诉（1体力）
              </Button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>配送速度</th>
                  <th>食材新鲜</th>
                  <th>口味</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {appealableReviews.map((review, i) => {
                  const originalIndex = reviews.indexOf(review)
                  return (
                    <tr key={i}>
                      <td>{review.channel}</td>
                      <td>{review.tags.delivery_speed === 'good' ? '✅' : '❌'}</td>
                      <td>{review.tags.ingredient_freshness === 'good' ? '✅' : '❌'}</td>
                      <td>{review.tags.taste === 'good' ? '✅' : '❌'}</td>
                      <td>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={stamina.current < 1}
                          onClick={() => dispatch({ type: 'APPEAL_REVIEW', payload: { reviewIndex: originalIndex } })}
                        >
                          申诉（1体力）
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
