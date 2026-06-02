import { useState, useEffect } from 'react'
import { useGame } from '../../core/GameContext'
import { getSaveSlots } from '../../systems/SaveManager'
import type { GameState } from '../../types'
import { fmtMoney } from '../../utils/format'
import Button from '../ui/Button'

export default function StoryScreen() {
  const { dispatch } = useGame()
  const [shopName, setShopName] = useState('')
  const [showSaves, setShowSaves] = useState(false)
  const [saves, setSaves] = useState<(GameState | null)[]>([])
  const [showVersion, setShowVersion] = useState(false)

  useEffect(() => {
    if (showSaves) setSaves(getSaveSlots())
  }, [showSaves])

  const handleStart = () => {
    const name = shopName.trim() || '鸡架'
    dispatch({ type: 'SET_SHOP_NAME', payload: { name } })
    dispatch({ type: 'START_GAME' })
  }

  return (
    <div className="story-screen" style={{ position: 'relative' }}>
      <button
        onClick={() => setShowVersion(true)}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          fontFamily: 'var(--pixel-font)', fontSize: '11px',
          color: 'var(--color-gold)', background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--color-gold)', borderRadius: '4px',
          padding: '2px 8px', cursor: 'pointer', zIndex: 10,
        }}
      >
        V1.0
      </button>

      {showVersion && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', padding: '16px',
        }}>
          <div style={{
            maxWidth: '380px', width: '100%', background: 'var(--color-cream, #fdf6e3)',
            borderRadius: '12px', padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '16px' }}>
              260530-V1.0游戏上线
            </div>
            <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', lineHeight: '2', color: '#333', marginBottom: '16px', textAlign: 'left' }}>
              1. 采购原料、管理店员、研发配方，经营你的鸡架店<br/>
              2. 拓展外卖平台与B端客户，打造商业版图<br/>
              3. 目标：收购总部，成为真正的鸡架之王！
            </div>
            <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '10px', lineHeight: '1.8', color: '#999', marginBottom: '16px', textAlign: 'left' }}>
              PM Owner：鼠<br/>
              RD Owner：Trae Solo x glm5.1<br/>
              设计：Trae Solo x glm5.1<br/>
              QA：鼠 & Trae Solo x glm5.1
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowVersion(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      <div className="story-title">🍗 鸡架老板模拟器</div>
      <div className="story-text">
        你曾是某互联网大厂的供应链经理，每天加班到深夜，吃着最爱的鸡架外卖，你突然想：如果自己开一家店，会是什么感觉？
        <br />
        一次偶然的机会，你路过一家东北拌鸡架加盟品牌的招商会。
        <br />
        "月入十万不是梦！总部全程扶持！零经验也能开店！"
        <br />
        台上的招商经理唾沫横飞，你却鬼使神差地交了定金。
        <br />
        辞职、交加盟费、租店面、买设备……
        <br />
        当你拿到钥匙的那一刻，
        <br />
        你深吸一口气，系上围裙，推开了店门。
        <br />
        <span style={{ fontSize: '12px', color: '#aaa' }}>
          在这个游戏里，你将经营一家鸡架加盟店，从采购原料到研发配方，
          从管理店员到拓展B端客户，一步步把小店做大做强。
          你的目标：收购总部，成为真正的鸡架之王！
        </span>
      </div>

      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <label style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px', color: 'var(--color-gold)', display: 'block', marginBottom: '8px' }}>
          🏪 为你的店铺取个名字吧
        </label>
        <input
          type="text"
          value={shopName}
          onChange={e => setShopName(e.target.value.slice(0, 10))}
          placeholder="1-10个字（默认：鸡架）"
          maxLength={10}
          style={{
            fontFamily: 'var(--pixel-font)',
            fontSize: '14px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '2px solid var(--color-brown)',
            background: 'var(--color-cream)',
            width: '240px',
            textAlign: 'center',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <Button variant="primary" size="lg" onClick={handleStart}>
          开始游戏
        </Button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowSaves(!showSaves)}
        >
          📂 读取存档
        </button>
      </div>

      {showSaves && (
        <div style={{ marginTop: '12px', width: '100%', maxWidth: '400px' }}>
          {saves.every(s => s === null) ? (
            <p className="text-gray text-sm" style={{ textAlign: 'center' }}>暂无存档</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {saves.map((save, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--color-cream)', borderRadius: '6px',
                  fontFamily: 'var(--pixel-font)', fontSize: '12px',
                }}>
                  <span>
                    存档{i + 1}：{save ? `${save.shopName || '鸡架'}店 - 第${save.absoluteWeek}周 - 💰${fmtMoney(save.cash)}元` : '空'}
                  </span>
                  {save && (
                    <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'LOAD_SAVE', payload: { slot: i } })}>
                      读取
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
