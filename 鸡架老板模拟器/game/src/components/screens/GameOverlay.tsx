import { useGame } from '../../core/GameContext'
import { fmtMoney } from '../../utils/format'
import Button from '../ui/Button'

export default function GameOverlay() {
  const { state, dispatch } = useGame()
  const { gamePhase, totalCashEarned, totalRevenue, totalExpenses, storeCount, patentedRecipeCount, brandAwareness, pendingBankruptcyStory, pendingAcquireStory, pendingDirectStoreStory, cash, acquiredBrand, titles, brandGoodwill } = state

  if (pendingDirectStoreStory) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)', padding: '24px',
      }}>
        <div style={{
          maxWidth: '600px', width: '100%', background: 'var(--color-cream, #fdf6e3)',
          borderRadius: '12px', padding: '32px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '20px', fontWeight: 'bold', color: 'var(--color-danger, #c0392b)', marginBottom: '20px' }}>
            🏢 总部直营店开业
          </div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px', lineHeight: '1.8', color: '#333', textAlign: 'left', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
            {`你像往常一样查看外卖平台数据，却发现附近多了一家同品牌的店——而且价格比你低两成。你拨通了总部运营的电话。"你们怎么能在我的地盘开直营店？"你质问道。电话那头沉默了几秒，然后传来一个冷冰冰的声音："这是公司战略部署，你无权干涉。""那我的加盟费呢？你们收了我几万块加盟费，转头就跟我抢生意？""加盟费是品牌授权费用，合同里写得很清楚，我们不承诺区域保护。爱干不干，加盟费一份不退。"你攥紧了手机，指节发白。挂掉电话后，你看着窗外那家新开的直营店，招牌在阳光下格外刺眼。你深吸一口气——这条路，只能靠自己走下去了。`}
          </div>
          <Button variant="primary" size="lg" onClick={() => dispatch({ type: 'DISMISS_DIRECT_STORE_STORY' })}>
            确认
          </Button>
        </div>
      </div>
    )
  }

  if (pendingAcquireStory && !acquiredBrand) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)', padding: '24px',
      }}>
        <div style={{
          maxWidth: '600px', width: '100%', background: 'var(--color-cream, #fdf6e3)',
          borderRadius: '12px', padding: '32px', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '20px', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '20px' }}>
            👑 收购品牌总部
          </div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px', lineHeight: '1.8', color: '#333', textAlign: 'left', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
            {`你站在自己的店铺门口，看着来来往往的顾客，心中感慨万千。从当初那个被加盟费套牢的小白，到如今拥有自研配方、独立运营的老板，这条路走了太久。总部的打压从未停止——直营店抢客、供应链断供、甚至暗中挖你的员工。但你一次次挺了过来，用实力证明了自己。就在今天，你收到了一个消息：总部品牌因过度扩张陷入经济危机，资金链断裂，正在寻求收购方。你翻看着自己的银行账户，数字已经超过了五十万。这几年受的委屈、吃的苦、扛的压力，在这一刻都有了出口。"是时候了。"你对自己说。收购总部，不仅仅是商业行为——这是你对自己这些年所有坚持的交代。从此以后，这个品牌，由你说了算。`}
          </div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', color: '#666', marginBottom: '16px' }}>
            收购费用：500,000元 | 当前现金：{fmtMoney(cash)}元
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button variant="primary" size="lg" disabled={cash < 500000} onClick={() => dispatch({ type: 'ACQUIRE_BRAND' })}>
              收购总部（50万）
            </Button>
            <Button variant="secondary" size="lg" onClick={() => dispatch({ type: 'LOAD_STATE', payload: { ...state, pendingAcquireStory: null } })}>
              暂不收购
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
    const netProfit = totalRevenue - totalExpenses
    return (
      <div className="victory-overlay">
        <h1>🏆 鸡架之王</h1>
        <p>
          恭喜你成功收购品牌总部并稳定经营3个月！
          <br />
          你获得了称号【鸡架之王】
          <br /><br />
          累计营收：{fmtMoney(totalRevenue)}元
          <br />
          累计支出：{fmtMoney(totalExpenses)}元
          <br />
          累计净利润：{fmtMoney(netProfit)}元
          <br />
          门店数：{storeCount}
          <br />
          专利配方：{patentedRecipeCount}个
          <br />
          品牌知名度：{brandAwareness}%
          <br />
          品牌商誉：{fmtMoney(brandGoodwill)}元
          <br />
          当前现金：{fmtMoney(cash)}元
          <br />
          称号：{titles.join('、')}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button variant="primary" size="lg" onClick={() => dispatch({ type: 'LOAD_STATE', payload: { ...state, gamePhase: 'story' } })}>
            结束游戏
          </Button>
          <Button variant="secondary" size="lg" onClick={() => dispatch({ type: 'LOAD_STATE', payload: { ...state, gamePhase: 'playing' } })}>
            继续游戏
          </Button>
        </div>
      </div>
    )
  }

  return null
}
