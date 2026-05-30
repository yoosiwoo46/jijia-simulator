import { useMemo } from 'react'
import { useGame } from '../../core/GameContext'
import { INGREDIENT_CONFIG_MAP, CHANNEL_LABELS, CHANNEL_PRIORITY } from '../../core/constants'
import { fmtMoney } from '../../utils/format'
import { calculateKitchenCapacity } from '../../core/GameEngine'
import { calculateTotalNeededIngredients } from '../../systems/OrderSystem'
import StatusBadge from '../ui/StatusBadge'
import type { IngredientType } from '../../types'

export default function ProductionScreen() {
  const { state } = useGame()
  const { channelOrderForecasts, inventory, hasBeerLicense, isFranchisePeriod, employees } = state

  const inventoryMap = useMemo(() => {
    const m = new Map<IngredientType, number>()
    for (const item of inventory) {
      m.set(item.type, (m.get(item.type) || 0) + item.quantity)
    }
    return m
  }, [inventory])

  const sortedForecasts = useMemo(
    () => [...channelOrderForecasts]
      .filter(f => f.orders > 0)
      .sort((a, b) => CHANNEL_PRIORITY.indexOf(a.channel) - CHANNEL_PRIORITY.indexOf(b.channel)),
    [channelOrderForecasts],
  )

  const totalNeeded = useMemo(
    () => calculateTotalNeededIngredients(channelOrderForecasts, isFranchisePeriod),
    [channelOrderForecasts, isFranchisePeriod],
  )

  const totalOrders = channelOrderForecasts.reduce((sum, f) => sum + f.orders, 0)

  const kitchenInfo = useMemo(() => {
    const { totalCapacity } = calculateKitchenCapacity(employees, 0)
    const standardCap = employees
      .filter(e => e.position === 'kitchen')
      .reduce((sum, w) => {
        const speed = w.isDualRole ? w.skills.speed * 0.85 : w.skills.speed
        const stamina = w.isDualRole ? w.skills.stamina_skill * 0.85 : w.skills.stamina_skill
        return sum + 15 * (stamina + speed) * 7
      }, 0)
    return { max: totalCapacity, standard: Math.round(standardCap) }
  }, [employees])

  const ingredientShortage = useMemo(() => {
    const shortages: { name: string; needed: number; have: number; gap: number }[] = []
    for (const [type, needed] of Object.entries(totalNeeded)) {
      if (!needed || needed <= 0) continue
      const t = type as IngredientType
      const have = inventoryMap.get(t) || 0
      if (have < needed) {
        shortages.push({
          name: INGREDIENT_CONFIG_MAP.get(t)?.name ?? t,
          needed,
          have,
          gap: needed - have,
        })
      }
    }
    return shortages
  }, [totalNeeded, inventoryMap])

  return (
    <div>
      <h2 className="screen-title">📋 生产计划</h2>

      <div className="card">
        <div className="card-title">各渠道订单预测</div>
        <p className="text-gray text-sm" style={{ marginBottom: '8px' }}>
          订单按渠道优先级自动分配：B端 &gt; MT &gt; SG &gt; JD &gt; 到店 &gt; 私域，库存不足自动取消
        </p>
        {sortedForecasts.length === 0 ? (
          <p className="text-gray text-sm">本周暂无订单</p>
        ) : (
          sortedForecasts.map(forecast => (
            <div key={forecast.channel} style={{ marginBottom: '16px' }}>
              <div style={{
                fontWeight: 'bold',
                fontFamily: 'var(--pixel-font)',
                fontSize: '13px',
                color: 'var(--color-gold)',
                marginBottom: '6px',
                borderBottom: '1px solid var(--color-brown)',
                paddingBottom: '4px',
              }}>
                {CHANNEL_LABELS[forecast.channel] || forecast.channelLabel}（{forecast.orders}单）
              </div>
              {(forecast.skuDetails || []).map((sku, i) => (
                <div key={i} style={{
                  fontFamily: 'var(--pixel-font)',
                  fontSize: '11px',
                  padding: '4px 8px',
                  marginBottom: '4px',
                  background: 'var(--color-cream)',
                  borderRadius: '4px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <strong>{sku.name}</strong> | {sku.description} |{' '}
                      {sku.basePrice ? (
                        <>
                          平台价<span style={{ textDecoration: 'line-through' }}>{sku.basePrice}</span>
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', marginLeft: '4px' }}>券后价{fmtMoney(sku.price)}</span>
                        </>
                      ) : (
                        <>{fmtMoney(sku.price)}元</>
                      )} | {sku.count}单
                    </span>
                  </div>
                  <div style={{ color: '#666', marginTop: '2px' }}>
                    预计需要原料：{sku.ingredients.map(ing => `${ing.name}×${ing.count}`).join('，')}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-title">原料需求总览</div>
        {Object.keys(totalNeeded).length === 0 ? (
          <p className="text-gray text-sm">暂无原料需求</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>原料</th>
                <th>需要量</th>
                <th>当前库存</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totalNeeded)
                .filter(([, qty]) => qty && qty > 0)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([type, needed]) => {
                  const ingredientType = type as IngredientType
                  const config = INGREDIENT_CONFIG_MAP.get(ingredientType)
                  const name = config?.name ?? ingredientType
                  const neededQty = needed || 0
                  const inventoryQty = inventoryMap.get(ingredientType) || 0
                  const isSufficient = inventoryQty >= neededQty
                  const shortage = isSufficient ? 0 : neededQty - inventoryQty

                  return (
                    <tr key={type}>
                      <td>{name}</td>
                      <td>{neededQty}份</td>
                      <td>{inventoryQty}份</td>
                      <td>
                        {isSufficient ? (
                          <StatusBadge status="success" text="✅ 充足" />
                        ) : (
                          <StatusBadge status="danger" text={`❌ 缺${shortage}份`} />
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-title">生产计划汇总</div>
        <div className="employee-card">
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span>待生产订单：</span>
              <span className="text-bold" style={{ color: 'var(--color-success)' }}>
                {totalOrders}份
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span>后厨每周最大产能：</span>
              <span className="text-bold">
                {kitchenInfo.max}份（标准{kitchenInfo.standard}份 / 加班{kitchenInfo.max}份）
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span>原料短缺：</span>
              {ingredientShortage.length === 0 ? (
                <span className="text-bold" style={{ color: 'var(--color-success)' }}>无</span>
              ) : (
                <span className="text-bold text-red">
                  {ingredientShortage.map(s => `${s.name}缺${s.gap}份`).join('、')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
