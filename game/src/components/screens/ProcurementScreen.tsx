import React, { useState, useMemo } from 'react'
import { useGame } from '../../core/GameContext'
import { INGREDIENT_CONFIG_MAP, type IngredientConfig } from '../../core/constants'
import { calculateTotalNeededIngredients } from '../../systems/OrderSystem'
import type { IngredientType, ProcurementChannel } from '../../types'
import Button from '../ui/Button'
import StatusBadge from '../ui/StatusBadge'
import { fmtMoney } from '../../utils/format'

type CartItem = {
  ingredientType: IngredientType
  quantity: number
  channel: ProcurementChannel
  unitPrice: number
  subtotal: number
}

function getUnitPrice(cfg: IngredientConfig | undefined, ch: ProcurementChannel, wholesalePrice?: number): number {
  if (!cfg) return 0
  if (ch === 'official') return cfg.officialPrice ?? 0
  if (wholesalePrice !== undefined) return wholesalePrice
  const range = cfg.otherPriceRange
  if (!range) return 0
  return range[0]
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export default function ProcurementScreen() {
  const { state, dispatch } = useGame()
  const { inventory, cash, stamina, channelOrderForecasts, absoluteWeek, isFranchisePeriod } = state

  const wholesalePriceMap = useMemo(() => {
    const m = new Map<IngredientType, number>()
    let seed = absoluteWeek * 7919
    for (const [type, cfg] of INGREDIENT_CONFIG_MAP.entries()) {
      if (cfg.otherPriceRange) {
        const [min, max] = cfg.otherPriceRange
        seed++
        const rand = seededRandom(seed)
        m.set(type, Math.floor(rand * (max - min + 1)) + min)
      }
    }
    return m
  }, [absoluteWeek])

  const sortedInventory = useMemo(
    () => [...inventory].sort((a, b) => a.remainingShelfLife - b.remainingShelfLife),
    [inventory],
  )

  const inventoryMap = useMemo(() => {
    const m = new Map<IngredientType, number>()
    for (const item of inventory) {
      m.set(item.type, (m.get(item.type) || 0) + item.quantity)
    }
    return m
  }, [inventory])

  const predictedDemand = useMemo(() => {
    const base = calculateTotalNeededIngredients(channelOrderForecasts, isFranchisePeriod)
    const result: Partial<Record<IngredientType, number>> = {}
    let i = 0
    for (const [type, qty] of Object.entries(base)) {
      if (qty && qty > 0) {
        if (!state.isFranchisePeriod && type === 'official_sauce') {
          i++
          continue
        }
        const variance = seededRandom(absoluteWeek * 1000 + i) * 0.2 - 0.1
        result[type as IngredientType] = Math.round(qty * (1 + variance))
      }
      i++
    }
    return result
  }, [channelOrderForecasts, absoluteWeek, isFranchisePeriod])

  const [selectedType, setSelectedType] = useState<IngredientType>('chicken_rack')
  const [quantity, setQuantity] = useState(100)
  const [channel, setChannel] = useState<ProcurementChannel>('official')
  const [cart, setCart] = useState<CartItem[]>([])
  const [addError, setAddError] = useState('')

  const config = INGREDIENT_CONFIG_MAP.get(selectedType)
  const unitPrice = getUnitPrice(config, channel, channel === 'wholesale' ? wholesalePriceMap.get(selectedType) : undefined)
  const subtotal = unitPrice * quantity

  const totalCost = useMemo(() => {
    let anyItemDiscounted = false
    let sum = 0
    for (const item of cart) {
      let discount = 1
      if (item.quantity >= 1200) discount = 0.8
      else if (item.quantity >= 800) discount = 0.9
      if (discount < 1) anyItemDiscounted = true
      sum += Math.round(item.unitPrice * item.quantity * discount)
    }
    if (!anyItemDiscounted && sum >= 12000) {
      sum = Math.round(sum * 0.9)
    }
    return sum
  }, [cart])
  const canAfford = cash >= totalCost && stamina.current >= 1

  function handleTypeChange(type: IngredientType) {
    setSelectedType(type)
    const cfg = INGREDIENT_CONFIG_MAP.get(type)
    if (cfg?.officialPrice) {
      setChannel('official')
    } else {
      setChannel('wholesale')
    }
  }

  function addToCart() {
    if (quantity <= 0) {
      setAddError('数量有误，不可添加')
      return
    }
    setAddError('')
    setCart(prev => [...prev, { ingredientType: selectedType, quantity, channel, unitPrice, subtotal }])
  }

  function removeFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  function handleAutoGenerate() {
    const newCart: CartItem[] = []
    for (const type of ingredientOrder) {
      const needed = predictedDemand[type]
      if (!needed || needed <= 0) continue
      const inventoryQty = inventoryMap.get(type) || 0
      const gap = needed - inventoryQty
      if (gap <= 0) continue
      const cfg = INGREDIENT_CONFIG_MAP.get(type)
      const ch: ProcurementChannel = cfg?.officialPrice ? 'official' : 'wholesale'
      const price = getUnitPrice(cfg, ch, ch === 'wholesale' ? wholesalePriceMap.get(type) : undefined)
      newCart.push({
        ingredientType: type,
        quantity: gap,
        channel: ch,
        unitPrice: price,
        subtotal: price * gap,
      })
    }
    setCart(newCart)
  }

  function handleChannelChange(index: number, newChannel: ProcurementChannel) {
    setCart(prev => prev.map((item, i) => {
      if (i !== index) return item
      const cfg = INGREDIENT_CONFIG_MAP.get(item.ingredientType)
      const newPrice = getUnitPrice(cfg, newChannel, newChannel === 'wholesale' ? wholesalePriceMap.get(item.ingredientType) : undefined)
      return { ...item, channel: newChannel, unitPrice: newPrice, subtotal: newPrice * item.quantity }
    }))
  }

  function handleQuantityChange(index: number, newQty: number) {
    setCart(prev => prev.map((item, i) => {
      if (i !== index) return item
      return { ...item, quantity: newQty, subtotal: item.unitPrice * newQty }
    }))
  }

  function handleBatchPurchase() {
    if (cart.length === 0) return
    dispatch({
      type: 'BATCH_PURCHASE_INGREDIENTS',
      payload: {
        items: cart.map(item => ({
          ingredientType: item.ingredientType,
          quantity: item.quantity,
          channel: item.channel,
          unitPrice: item.unitPrice,
        })),
      },
    })
    setCart([])
  }

  const [expandedTypes, setExpandedTypes] = useState<Set<IngredientType>>(new Set())

  const ingredientOrder = useMemo(() => Array.from(INGREDIENT_CONFIG_MAP.keys()), [])

  const inventoryByType = useMemo(() => {
    const m = new Map<IngredientType, { total: number; items: typeof sortedInventory }>()
    for (const item of sortedInventory) {
      if (!m.has(item.type)) m.set(item.type, { total: 0, items: [] })
      const group = m.get(item.type)!
      group.total += item.quantity
      group.items.push(item)
    }
    return m
  }, [sortedInventory])

  const sortedInventoryByType = useMemo(() => {
    const result: [IngredientType, { total: number; items: typeof sortedInventory }][] = []
    for (const type of ingredientOrder) {
      const group = inventoryByType.get(type)
      if (group) result.push([type, group])
    }
    return result
  }, [ingredientOrder, inventoryByType])

  function toggleType(type: IngredientType) {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div>
      <h2 className="screen-title">🛒 采购原料</h2>

      <div className="card">
        <div className="card-title">当前库存</div>
        {sortedInventory.length === 0 ? (
          <p className="text-gray text-sm">库存为空，请采购原料</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>原料名</th>
                <th>库存合计</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedInventoryByType.map(([type, group]) => {
                const name = INGREDIENT_CONFIG_MAP.get(type)?.name ?? type
                const isExpanded = expandedTypes.has(type)
                return (
                  <React.Fragment key={type}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => toggleType(type)}>
                      <td>{name} {isExpanded ? '▼' : '▶'}</td>
                      <td>{group.total}份</td>
                      <td></td>
                    </tr>
                    {isExpanded && group.items.map((item, j) => {
                      const originalIndex = inventory.indexOf(item)
                      return (
                        <tr key={`${type}-${j}`} style={{ background: 'var(--color-cream)' }}>
                          <td style={{ paddingLeft: '24px' }}>└ {item.remainingShelfLife <= 0 ? '已过期' : `距到期${item.remainingShelfLife}周`}</td>
                          <td>{item.quantity}份</td>
                          <td>
                            {item.remainingShelfLife <= 0 && (
                              <Button variant="danger" size="sm" onClick={() => dispatch({ type: 'DISCARD_EXPIRED', payload: { inventoryIndex: originalIndex } })}>
                                丢弃
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">预测本周需求</div>
          <Button variant="secondary" size="sm" onClick={handleAutoGenerate}>
            一键生成采购单
          </Button>
        </div>
        {Object.keys(predictedDemand).length === 0 ? (
          <p className="text-gray text-sm">暂无订单预测数据</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>原料名</th>
                <th>预测需求</th>
                <th>当前库存</th>
                <th>缺口</th>
              </tr>
            </thead>
            <tbody>
              {ingredientOrder
                .filter(type => predictedDemand[type] && predictedDemand[type]! > 0)
                .map(type => {
                  const needed = predictedDemand[type] || 0
                  const name = INGREDIENT_CONFIG_MAP.get(type)?.name ?? type
                  const inventoryQty = inventoryMap.get(type) || 0
                  const gap = Math.max(0, needed - inventoryQty)
                  return (
                      <tr key={type}>
                        <td>{name}</td>
                        <td>{needed}份</td>
                        <td>{inventoryQty}份</td>
                      <td>
                        {gap > 0 ? (
                          <StatusBadge status="danger" text={`缺${gap}份`} />
                        ) : (
                          <StatusBadge status="success" text="充足" />
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
        <div className="card-title">采购清单</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <label>选择原料</label>
            <select value={selectedType} onChange={e => handleTypeChange(e.target.value as IngredientType)}>
              {Array.from(INGREDIENT_CONFIG_MAP.entries())
              .filter(([type]) => type !== 'self_sauce' || state.activeRecipeId !== null)
              .filter(([type]) => type !== 'official_sauce' || state.isFranchisePeriod)
              .map(([type, cfg]) => {
                const displayName = type === 'self_sauce' && state.activeRecipeId
                  ? `自研·${state.recipes.find(r => r.id === state.activeRecipeId)?.name || '拌料'}`
                  : cfg.name
                return <option key={type} value={type}>{displayName}</option>
              })}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 80px', marginBottom: 0 }}>
            <label>数量</label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <div className="form-group" style={{ flex: '1 1 100px', marginBottom: 0 }}>
            <label>渠道</label>
            <select value={channel} onChange={e => setChannel(e.target.value as ProcurementChannel)}>
              <option value="official" disabled={!config?.officialPrice}>官方渠道</option>
              <option value="wholesale" disabled={!config?.otherPriceRange}>批发市场</option>
            </select>
          </div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', minWidth: '80px' }}>
            <div>单价：<span className="text-bold text-red">{fmtMoney(unitPrice)}元</span></div>
            <div>小计：<span className="text-bold text-red">{fmtMoney(subtotal)}元</span></div>
          </div>
          <Button variant="secondary" size="sm" onClick={addToCart}>
            添加
          </Button>
        </div>
        {addError && <div className="text-red text-sm" style={{ marginTop: '4px' }}>{addError}</div>}

        {cart.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>原料</th>
                <th>数量</th>
                <th>渠道</th>
                <th>单价</th>
                <th>小计</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => {
                const name = INGREDIENT_CONFIG_MAP.get(item.ingredientType)?.name ?? item.ingredientType
                const cfg = INGREDIENT_CONFIG_MAP.get(item.ingredientType)
                let discount = 1
                if (item.quantity >= 1200) discount = 0.8
                else if (item.quantity >= 800) discount = 0.9
                const discountedSubtotal = Math.round(item.unitPrice * item.quantity * discount)
                return (
                  <tr key={i}>
                    <td>{name}</td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={e => {
                          const v = Number(e.target.value)
                          if (v > 0) handleQuantityChange(i, v)
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                      />份
                    </td>
                    <td>
                      <select
                        value={item.channel}
                        onChange={e => handleChannelChange(i, e.target.value as ProcurementChannel)}
                        style={{ fontSize: '12px' }}
                      >
                        <option value="official" disabled={!cfg?.officialPrice}>官方</option>
                        <option value="wholesale" disabled={!cfg?.otherPriceRange}>批发</option>
                      </select>
                    </td>
                    <td>{fmtMoney(item.unitPrice)}元</td>
                    <td>
                      {discount < 1 ? (
                        <><span style={{ textDecoration: 'line-through' }}>{fmtMoney(item.subtotal)}</span> <span className="text-red">{fmtMoney(discountedSubtotal)}元</span></>
                      ) : (
                        `${fmtMoney(item.subtotal)}元`
                      )}
                    </td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => removeFromCart(i)}>
                        删除
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {cart.length > 0 && (
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', margin: '8px 0' }}>
            <div>总计：<span className="text-bold text-red">{fmtMoney(totalCost)}元</span></div>
            <div className="cost-hint">
              消耗体力：<span className="cost-value">1点</span>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          disabled={cart.length === 0 || !canAfford}
          onClick={handleBatchPurchase}
        >
          确认采购
        </Button>
        {cart.length > 0 && !canAfford && (
          <div className="text-red text-sm mt-8">
            {cash < totalCost ? '现金不足' : '体力不足'}
          </div>
        )}
      </div>
    </div>
  )
}
