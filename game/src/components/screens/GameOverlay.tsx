import { useGame } from '../../core/GameContext'
import { fmtMoney } from '../../utils/format'
import Button from '../ui/Button'

export default function GameOverlay() {
  const { state, dispatch } = useGame()
  const { gamePhase, totalCashEarned, storeCount, patentedRecipeCount, brandAwareness, monthlyRevenue, pendingBankruptcyStory } = state

  if (pendingBankruptcyStory) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'var(--color-cream, #fdf6e3)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--pixel-font)',
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'var(--color-danger, #c0392b)',
            marginBottom: '20px',
          }}>
            ⚠️ 资金危机
          </div>
          <div style={{
            fontFamily: 'var(--pixel-font)',
            fontSize: '13px',
            lineHeight: '1.8',
            color: '#333',
            textAlign: 'left',
            marginBottom: '24px',
            whiteSpace: 'pre-wrap',
          }}>
            {pendingBankruptcyStory}
          </div>
          <Button variant="primary" size="lg" onClick={() => dispatch({ type: 'DISMISS_BANKRUPTCY_STORY' })}>
            继续
          </Button>
        </div>
      </div>
    )
  }

  if (gamePhase === 'game_over') {
    return (
      <div className="game-over-overlay">
        <h1>💀 破产了</h1>
        <p>
          你的鸡架店因为资金链断裂而倒闭了。
          <br />
          累计营收：{fmtMoney(totalCashEarned)}元
          <br />
          门店数：{storeCount}
        </p>
        <Button variant="danger" size="lg" onClick={() => dispatch({ type: 'LOAD_STATE', payload: { ...state, gamePhase: 'story' } })}>
          重新开始
        </Button>
      </div>
    )
  }

  if (gamePhase === 'victory') {
    return (
      <div className="victory-overlay">
        <h1>🏆 收购总部！</h1>
        <p>
          恭喜你成功收购了鸡架品牌总部！
          <br />
          你现在是真正的鸡架之王！
          <br /><br />
          累计营收：{fmtMoney(totalCashEarned)}元
          <br />
          门店数：{storeCount}
          <br />
          专利配方：{patentedRecipeCount}个
          <br />
          品牌知名度：{brandAwareness}%
          <br />
          月营收：{fmtMoney(monthlyRevenue)}元
        </p>
        <Button variant="primary" size="lg" onClick={() => dispatch({ type: 'LOAD_STATE', payload: { ...state, gamePhase: 'story' } })}>
          再来一局
        </Button>
      </div>
    )
  }

  return null
}
