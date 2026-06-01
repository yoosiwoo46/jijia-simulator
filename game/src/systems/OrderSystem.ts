import type { IngredientType, InventoryItem, ChannelOrderForecast } from '../types'
import { SKU_CONFIGS, CHANNEL_PRIORITY, CHANNEL_LABELS, INGREDIENT_CONFIG_MAP } from '../core/constants'

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成单个订单的随机SKU组合（主食 + 可选配菜 + 可选饮品）
 * 不包含 tofu_skin 或 chicken_leg（已从游戏中移除）
 */
export function generateOrderSKU(): Partial<Record<IngredientType, number>> {
  const mains = SKU_CONFIGS.filter((s) => s.type === 'main')
  const sides = SKU_CONFIGS.filter((s) => s.type === 'side')
  const drinks = SKU_CONFIGS.filter((s) => s.type === 'drink')

  const selectedMain = mains[randInt(0, mains.length - 1)]
  const result: Partial<Record<IngredientType, number>> = { ...selectedMain.ingredients }

  // 70% 概率加一份随机配菜
  if (Math.random() < 0.7 && sides.length > 0) {
    const selectedSide = sides[randInt(0, sides.length - 1)]
    for (const [key, val] of Object.entries(selectedSide.ingredients)) {
      const k = key as IngredientType
      result[k] = (result[k] || 0) + (val || 0)
    }
  }

  // 40% 概率加一份随机饮品
  if (Math.random() < 0.4 && drinks.length > 0) {
    const selectedDrink = drinks[randInt(0, drinks.length - 1)]
    for (const [key, val] of Object.entries(selectedDrink.ingredients)) {
      const k = key as IngredientType
      result[k] = (result[k] || 0) + (val || 0)
    }
  }

  return result
}

/**
 * 根据订单数量计算所需原料总量（使用统计平均值）
 * 每份订单：主食必定（chicken_rack + official_sauce），
 * 70% 概率加一份随机配菜，40% 概率加一份随机饮品
 */
export function calculateIngredientsForOrders(
  orderCount: number,
  hasBeerLicense: boolean = false,
  useOfficialSauce: boolean = true,
  enabledSkus?: string[],
  hasActiveEvent: boolean = false,
  hasSelfSauce: boolean = false,
  isPlatformChannel: boolean = false,
): Partial<Record<IngredientType, number>> {
  const allSides = SKU_CONFIGS.filter((s) => s.type === 'side')
  const allDrinks = SKU_CONFIGS.filter((s) => s.type === 'drink')

  const sides = enabledSkus
    ? allSides.filter((s) => enabledSkus.includes(s.id))
    : allSides
  const drinks = enabledSkus
    ? allDrinks.filter((s) => enabledSkus.includes(s.id))
    : allDrinks

  // 过滤掉需要许可证的饮品（如果没有许可证）
  const availableDrinks = hasBeerLicense
    ? drinks
    : drinks.filter((d) => !d.requiresLicense)

  const total: Partial<Record<IngredientType, number>> = {}

  // 主食：每份订单必定需要
  const mainCount = orderCount
  total['chicken_rack'] = (total['chicken_rack'] || 0) + mainCount
  if (useOfficialSauce && (isPlatformChannel || !hasSelfSauce)) {
    total['official_sauce'] = (total['official_sauce'] || 0) + mainCount
  } else if (hasSelfSauce) {
    total['self_sauce'] = (total['self_sauce'] || 0) + mainCount
  } else {
    total['official_sauce'] = (total['official_sauce'] || 0) + mainCount
  }

  // 配菜：70% 的订单会加一份，在所有配菜中均匀分布
  if (sides.length > 0) {
    const sideOrders = orderCount * 0.7
    const perSide = sideOrders / sides.length
    for (const side of sides) {
      for (const [key, val] of Object.entries(side.ingredients)) {
        if (val) {
          const k = key as IngredientType
          total[k] = (total[k] || 0) + perSide * val
        }
      }
    }
  }

  // 饮品：40% 的订单会加一份，在所有可用饮品中均匀分布
  if (availableDrinks.length > 0) {
    const drinkOrders = orderCount * 0.4
    const perDrink = drinkOrders / availableDrinks.length
    for (const drink of availableDrinks) {
      for (const [key, val] of Object.entries(drink.ingredients)) {
        if (val) {
          const k = key as IngredientType
          total[k] = (total[k] || 0) + perDrink * val
        }
      }
    }
  }

  if (hasActiveEvent) {
    const eventComboOrders = Math.round(orderCount * 0.1)
    total['event_merch'] = (total['event_merch'] || 0) + eventComboOrders
  }

  for (const key of Object.keys(total) as IngredientType[]) {
    total[key] = Math.round(total[key] || 0)
  }

  return total
}

export function generateSKUProducts(orderCount: number): { name: string; count: number }[] {
  const mains = SKU_CONFIGS.filter(s => s.type === 'main')
  const sides = SKU_CONFIGS.filter(s => s.type === 'side')
  const drinks = SKU_CONFIGS.filter(s => s.type === 'drink')

  const products: { name: string; count: number }[] = []

  for (const main of mains) {
    products.push({ name: main.name, count: orderCount })
  }

  if (sides.length > 0) {
    const sideOrders = Math.round(orderCount * 0.7)
    const perSide = Math.round(sideOrders / sides.length)
    for (const side of sides) {
      if (perSide > 0) products.push({ name: side.name, count: perSide })
    }
  }

  if (drinks.length > 0) {
    const drinkOrders = Math.round(orderCount * 0.4)
    const perDrink = Math.round(drinkOrders / drinks.length)
    for (const drink of drinks) {
      if (perDrink > 0) products.push({ name: drink.name, count: perDrink })
    }
  }

  return products
}

export function generateSKUDetails(
  orderCount: number,
  _hasBeerLicense: boolean,
  isFranchisePeriod: boolean,
): ChannelOrderForecast['skuDetails'] {
  const details: ChannelOrderForecast['skuDetails'] = []
  const mainCount = orderCount
  const sideCount = Math.round(orderCount * 0.7)
  const drinkCount = Math.round(orderCount * 0.4)

  const allDrinks = SKU_CONFIGS.filter(s => s.type === 'drink')

  const sauceName = isFranchisePeriod ? '官方拌料' : '自研拌料'
  details.push({
    name: '拌鸡架',
    description: '拌鸡架+拌料',
    price: SKU_CONFIGS.find(s => s.type === 'main')?.price || 10,
    count: mainCount,
    ingredients: [
      { name: '生鸡架', count: mainCount },
      { name: sauceName, count: mainCount },
    ],
  })

  const comboACount = Math.round(sideCount * 0.5)
  if (comboACount > 0) {
    details.push({
      name: '套餐A',
      description: '拌鸡架+海带结',
      price: 13,
      count: comboACount,
      ingredients: [
        { name: '生鸡架', count: comboACount },
        ...(isFranchisePeriod ? [{ name: '官方拌料', count: comboACount }] : [{ name: '自研拌料', count: comboACount }]),
        { name: '海带结', count: comboACount },
      ],
    })
  }

  const comboBCount = sideCount - comboACount
  if (comboBCount > 0) {
    details.push({
      name: '套餐B',
      description: '拌鸡架+贡菜',
      price: 14,
      count: comboBCount,
      ingredients: [
        { name: '生鸡架', count: comboBCount },
        ...(isFranchisePeriod ? [{ name: '官方拌料', count: comboBCount }] : [{ name: '自研拌料', count: comboBCount }]),
        { name: '贡菜', count: comboBCount },
      ],
    })
  }

  const perDrink = allDrinks.length > 0 ? Math.round(drinkCount / allDrinks.length) : 0
  for (const drink of allDrinks) {
    if (perDrink > 0) {
      const ingredientNames = Object.entries(drink.ingredients)
        .filter(([, qty]) => qty && qty > 0)
        .map(([type]) => {
          const config = INGREDIENT_CONFIG_MAP.get(type as IngredientType)
          return { name: config?.name ?? type, count: perDrink }
        })
      details.push({
        name: drink.name,
        description: drink.name,
        price: drink.price,
        count: perDrink,
        ingredients: ingredientNames,
      })
    }
  }

  return details
}

/**
 * 为当前周生成所有渠道的订单预测
 * 在推进到下一周时调用
 */
export function generateChannelOrderForecasts(
  orderCounts: Record<string, number>,
  hasBeerLicense: boolean,
  isFranchisePeriod: boolean,
  weeklyPriceAdjustments: Record<string, number> = {},
  enabledSkus?: string[],
  hasActiveEvent: boolean = false,
  hasSelfSauce: boolean = false,
): ChannelOrderForecast[] {
  const forecasts: ChannelOrderForecast[] = []

  for (const channel of CHANNEL_PRIORITY) {
    const baseOrders = orderCounts[channel] || 0

    let forecastOrders = baseOrders
    if (channel !== 'b2b' && baseOrders > 0) {
      const variance = (Math.random() * 0.4 - 0.2)
      forecastOrders = Math.max(0, Math.round(baseOrders * (1 + variance)))
    }

    const skuBreakdown = calculateIngredientsForOrders(forecastOrders, hasBeerLicense, isFranchisePeriod, enabledSkus, hasActiveEvent, hasSelfSauce)
    const skuProducts = generateSKUProducts(forecastOrders)
    const skuDetails = generateSKUDetails(forecastOrders, hasBeerLicense, isFranchisePeriod)

    const adjustment = weeklyPriceAdjustments[channel] || 0
    if (adjustment !== 0) {
      for (const detail of skuDetails) {
        detail.basePrice = detail.price
        detail.price = Math.max(1, detail.price + adjustment)
      }
    }

    forecasts.push({
      channel,
      channelLabel: CHANNEL_LABELS[channel] || channel,
      orders: forecastOrders,
      skuBreakdown,
      skuProducts,
      skuDetails,
      isCancelled: false,
    })
  }

  return forecasts
}

/**
 * 根据用户的生产计划从库存中扣除原料
 * 返回新库存和短缺列表
 */
export function deductIngredientsFromPlan(
  inventory: InventoryItem[],
  fulfilledOrders: Map<string, number>,
  hasBeerLicense: boolean = false,
  useOfficialSauce: boolean = true,
  enabledSkus?: string[],
  hasActiveEvent: boolean = false,
  hasSelfSauce: boolean = false,
): { newInventory: InventoryItem[]; shortages: string[] } {
  const totalIngredients: Partial<Record<IngredientType, number>> = {}

  for (const [, orderCount] of fulfilledOrders) {
    const needed = calculateIngredientsForOrders(orderCount, hasBeerLicense, useOfficialSauce, enabledSkus, hasActiveEvent, hasSelfSauce)
    for (const [type, qty] of Object.entries(needed)) {
      if (qty) {
        const t = type as IngredientType
        totalIngredients[t] = (totalIngredients[t] || 0) + qty
      }
    }
  }

  const shortages: string[] = []
  const newInventory = inventory.map((item) => ({ ...item }))

  for (const [type, needed] of Object.entries(totalIngredients)) {
    if (!needed) continue
    let remaining = needed
    const t = type as IngredientType

    const sorted = newInventory
      .filter((item) => item.type === t && item.quantity > 0)
      .sort((a, b) => a.remainingShelfLife - b.remainingShelfLife)

    for (const item of sorted) {
      if (remaining <= 0) break
      const take = Math.min(item.quantity, remaining)
      item.quantity -= take
      remaining -= take
    }

    if (remaining > 0 && t === 'self_sauce') {
      const officialSorted = newInventory
        .filter((item) => item.type === 'official_sauce' && item.quantity > 0)
        .sort((a, b) => a.remainingShelfLife - b.remainingShelfLife)
      for (const item of officialSorted) {
        if (remaining <= 0) break
        const take = Math.min(item.quantity, remaining)
        item.quantity -= take
        remaining -= take
      }
    }

    if (remaining > 0) {
      const config = INGREDIENT_CONFIG_MAP.get(t)
      shortages.push(config?.name || t)
    }
  }

  return {
    newInventory: newInventory.filter((item) => item.quantity > 0),
    shortages,
  }
}

/**
 * 计算所有已确认渠道的原料总需求
 * 汇总所有未取消预测的 skuBreakdown
 */
export function calculateTotalNeededIngredients(
  forecasts: ChannelOrderForecast[],
): Partial<Record<IngredientType, number>> {
  const total: Partial<Record<IngredientType, number>> = {}

  for (const forecast of forecasts) {
    if (forecast.isCancelled) continue
    if (forecast.isOutsourced) continue

    for (const [type, qty] of Object.entries(forecast.skuBreakdown)) {
      if (qty) {
        const t = type as IngredientType
        total[t] = (total[t] || 0) + qty
      }
    }
  }

  return total
}
