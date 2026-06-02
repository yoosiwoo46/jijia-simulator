import type {
  Employee,
  GameState,
  GameTime,
  InventoryItem,
  Review,
  ReviewTag,
  B2BMerchant,
  ChannelSales,
  PlatformId,
  Shop,
  IngredientType,
} from '../types'
import { getWeekNumber } from '../types'
import {
  CANCELLED_ORDER_THRESHOLD,
  SUSPENSION_WEEKS,
  B2B_DELIVERY_FEE_PER_MERCHANT,
  MARKETING_INVESTMENT_PER_WEEK,
  CHANNEL_PRIORITY,
  B2B_RELATION_CONFIGS,
  B2B_BREACH_PENALTIES,
  INSPECTION_MONTHS,
  VICTORY_CASH_THRESHOLD,
  VICTORY_BRAND_AWARENESS,
  VICTORY_STORE_COUNT,
  VICTORY_MONTHLY_REVENUE,
  VICTORY_PATENTED_RECIPES,
  VICTORY_RECIPE_MIN_SCORE,
  TITLE_THRESHOLDS,
  SUMMER_MONTHS,
  INGREDIENT_CONFIG_MAP,
  SKU_CONFIGS,
  RANDOM_POSITIVE_EVENTS,
  RANDOM_NEGATIVE_EVENTS,
  getShelfLife,
  DELEGATE_REVENUE_DROP_PROBABILITY,
  DELEGATE_REVENUE_DROP_RANGE,
  DELEGATE_MARKETING_RISE_PROBABILITY,
  DELEGATE_MARKETING_RISE_RANGE,
  DUAL_ROLE_EFFICIENCY_PENALTY,
  DUAL_ROLE_COMPLAINT_PROBABILITY,
  PLATFORM_ORDER_RANKING,
  SELF_DELIVERY_BAD_REVIEW_PROB,
  DIRECT_STORE_WEEK,
  BANKRUPTCY_LOAN_AMOUNT,
  BANKRUPTCY_LOAN_REPAY_WEEKS,
  MAX_BANKRUPTCIES,
  CHANNEL_LABELS,
  MOOD_RESIGN_THRESHOLD,
} from './constants'
import { calculateMoodChange, shouldResign } from '../systems/PersonnelSystem'
import { fmtMoney } from '../utils/format'
import { generateChannelOrderForecasts, deductIngredientsFromPlan, calculateIngredientsForOrders } from '../systems/OrderSystem'

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function applyVariance(base: number, variance: number): number {
  const factor = 1 + (Math.random() * 2 - 1) * variance
  return Math.max(0, Math.round(base * factor))
}

function generateWeeklyPriceAdjustment(channel: string): number {
  const rand = Math.random()
  switch (channel) {
    case 'mt': case 'sg': case 'jd': {
      if (rand < 0.2) return 0
      if (rand < 0.5) return -1
      if (rand < 0.8) return -2
      return -3
    }
    case 'b2b': {
      if (rand < 0.4) return 0
      if (rand < 0.8) return -1
      return -2
    }
    case 'offline':
      return 0
    case 'private_domain': {
      if (rand < 0.3) return 1
      if (rand < 0.6) return 2
      if (rand < 0.8) return 3
      if (rand < 0.9) return 4
      return 5
    }
    default:
      return 0
  }
}

/**
 * Fix #3: Only charge overtime when actual orders exceed standard capacity.
 * Calculates kitchen capacity and overtime cost based on actual order volume.
 */
export function calculateKitchenCapacity(
  employees: Employee[],
  totalOrders: number = 0,
): { totalCapacity: number; overtimeCost: number } {
  const kitchenStaff = employees.filter((e) => e.position === 'kitchen')
  if (kitchenStaff.length === 0) return { totalCapacity: 0, overtimeCost: 0 }

  let standardCapacity = 0
  let maxCapacity = 0

  for (const worker of kitchenStaff) {
    const effectiveSpeed = worker.isDualRole
      ? worker.skills.speed * (1 - DUAL_ROLE_EFFICIENCY_PENALTY)
      : worker.skills.speed
    const effectiveStamina = worker.isDualRole
      ? worker.skills.stamina_skill * (1 - DUAL_ROLE_EFFICIENCY_PENALTY)
      : worker.skills.stamina_skill

    const outputMultiplier = worker.isIntern ? 8 : 15
    const dailyStandard = outputMultiplier * (effectiveStamina + effectiveSpeed)
    const dailyMax = Math.round(dailyStandard * 1.4)
    standardCapacity += dailyStandard * 7
    maxCapacity += dailyMax * 7
  }

  let overtimeCost = 0
  if (totalOrders > standardCapacity) {
    const overtimeOrders = totalOrders - standardCapacity
    overtimeCost = Math.round(overtimeOrders * 0.5)
  }

  return { totalCapacity: Math.round(maxCapacity), overtimeCost }
}

export function generateOrdersForChannel(channel: string, state: GameState): number {

  switch (channel) {
    case 'b2b': {
      let total = 0
      for (const merchant of state.b2bMerchants) {
        if (merchant.isActive && merchant.currentWeekOrders > 0) {
          total += merchant.currentWeekOrders
        }
      }
      return total
    }
    case 'mt': {
      const platform = state.platforms.find((p) => p.id === 'mt')
      if (!platform || !platform.isJoined || platform.isSuspended) return 0
      const weeksSinceJoined = platform.weekJoined ? state.absoluteWeek - platform.weekJoined : 999
      const baseOrders = 550
      let orders: number
      if (weeksSinceJoined < 8) {
        orders = Math.round(baseOrders * 0.8)
      } else {
        orders = Math.round(baseOrders * (platform.rating / 5))
      }
      const activeRecipe = state.recipes.find(r => r.id === state.activeRecipeId)
      const selfSauceBonus = (activeRecipe && activeRecipe.score >= 8 && state.leftFranchise) ? 0.02 : 0
      orders = Math.round(orders * (1 + (platform.marketingBoost || 0) + selfSauceBonus))
      return Math.max(0, applyVariance(orders, 0.3))
    }
    case 'sg': {
      const platform = state.platforms.find((p) => p.id === 'sg')
      if (!platform || !platform.isJoined || platform.isSuspended) return 0
      const weeksSinceJoined = platform.weekJoined ? state.absoluteWeek - platform.weekJoined : 999
      const baseOrders = 500
      let orders: number
      if (weeksSinceJoined < 8) {
        orders = Math.round(baseOrders * 0.8)
      } else {
        orders = Math.round(baseOrders * (platform.rating / 5))
      }
      const activeRecipe = state.recipes.find(r => r.id === state.activeRecipeId)
      const selfSauceBonus = (activeRecipe && activeRecipe.score >= 8 && state.leftFranchise) ? 0.02 : 0
      orders = Math.round(orders * (1 + (platform.marketingBoost || 0) + selfSauceBonus))
      return Math.max(0, applyVariance(orders, 0.3))
    }
    case 'jd': {
      const platform = state.platforms.find((p) => p.id === 'jd')
      if (!platform || !platform.isJoined || platform.isSuspended) return 0
      const weeksSinceJoined = platform.weekJoined ? state.absoluteWeek - platform.weekJoined : 999
      const baseOrders = 200
      let orders: number
      if (weeksSinceJoined < 8) {
        orders = Math.round(baseOrders * 0.8)
      } else {
        orders = Math.round(baseOrders * (platform.rating / 5))
      }
      const activeRecipe = state.recipes.find(r => r.id === state.activeRecipeId)
      const selfSauceBonus = (activeRecipe && activeRecipe.score >= 8 && state.leftFranchise) ? 0.02 : 0
      orders = Math.round(orders * (1 + (platform.marketingBoost || 0) + selfSauceBonus))
      return Math.max(0, applyVariance(orders, 0.3))
    }
    case 'offline': {
      const maxCustomers = state.shop.maxCustomers
      let baseOrders = maxCustomers * 21
      const hasAdScreen = state.shop.furniture.some((f) => f.type === 'ad_screen' && f.count > 0)
      if (hasAdScreen) baseOrders = Math.round(baseOrders * 1.1)
      if (state.watchPartyActive) baseOrders = Math.round(baseOrders * 3)
      return Math.max(0, applyVariance(baseOrders, 0.2))
    }
    case 'private_domain': {
      let totalFollowers = 0
      for (const pd of state.privateDomains) {
        if (pd.isActive) totalFollowers += pd.followerCount
      }
      const baseOrders = Math.round(totalFollowers * 0.3)
      let total = applyVariance(baseOrders, 0.2)

      const hasDiscountStrategy = state.privateDomains.some(pd => pd.isActive && pd.strategy === 'discount')
      if (hasDiscountStrategy) {
        total = Math.round(total * 1.2)
      }

      const anyDelegated = state.privateDomains.some(pd => pd.isDelegated && pd.delegatedEmployeeId)
      if (anyDelegated) {
        const delegate = state.employees.find((e) => e.id === state.privateDomains.find(pd => pd.delegatedEmployeeId)?.delegatedEmployeeId)
        if (delegate) {
          if (delegate.skills.speechcraft >= 9) {
            const bonus = randFloat(0.15, 0.25)
            total = Math.round(total * (1 + bonus))
          } else if (delegate.skills.speechcraft <= 7) {
            if (Math.random() < 0.25) {
              total = Math.round(total * (1 - randFloat(0.3, 0.5)))
            }
          }
        }
      }
      return Math.max(0, total)
    }
    default:
      return 0
  }
}

function getActiveEventBonus(state: GameState): number {
  const hasActiveEvent = state.marketingEvents.some((e) => e.isActive)
  if (!hasActiveEvent) return 1

  const hasTv = state.shop.furniture.some((f) => f.type === 'tv' && f.count > 0)
  const hasProjector = state.shop.furniture.some((f) => f.type === 'projector' && f.count > 0)

  if (hasProjector) return 1.5
  if (hasTv) return 1.3
  return 1.1
}

/**
 * Fix #6: Marketing bonus is now random 5-15% per active platform
 * instead of fixed 15%.
 */
function getMarketingBonus(state: GameState): number {
  const activeMarketingCount = state.platforms.filter((p) => p.isJoined && p.marketingActive).length
  if (activeMarketingCount === 0) return 1
  return 1 + activeMarketingCount * randFloat(0.05, 0.15)
}

/**
 * Fix #4: Delegate revenue drop is now applied here in revenue calculation
 * instead of in order generation.
 */
function calculateAverageOrderPrice(hasBeerLicense: boolean): number {
  const mainPrice = 12
  const sides = SKU_CONFIGS.filter(s => s.type === 'side')
  const avgSidePrice = sides.length > 0 ? sides.reduce((sum, s) => sum + s.price, 0) / sides.length : 0
  const allDrinks = SKU_CONFIGS.filter(s => s.type === 'drink')
  const availableDrinks = hasBeerLicense ? allDrinks : allDrinks.filter(d => !d.requiresLicense)
  const avgDrinkPrice = availableDrinks.length > 0 ? availableDrinks.reduce((sum, d) => sum + d.price, 0) / availableDrinks.length : 0
  return mainPrice + 0.7 * avgSidePrice + 0.4 * avgDrinkPrice
}

function calculatePlatformRevenue(orders: number, platformId: PlatformId, state: GameState): number {
  const basePrice = calculateAverageOrderPrice(state.hasBeerLicense)
  const adjustment = state.weeklyPriceAdjustments[platformId] || 0
  const effectivePrice = Math.max(1, basePrice + adjustment)
  const commissionRates: Record<PlatformId, number> = { sg: 0.10, mt: 0.15, jd: 0.10 }
  let revenue = Math.round(orders * effectivePrice * (1 - (commissionRates[platformId] || 0.2)))

  const platform = state.platforms.find((p) => p.id === platformId)
  if (platform && platform.isDelegated && Math.random() < DELEGATE_REVENUE_DROP_PROBABILITY) {
    const drop = randFloat(DELEGATE_REVENUE_DROP_RANGE[0], DELEGATE_REVENUE_DROP_RANGE[1])
    revenue = Math.round(revenue * (1 - drop))
  }

  return revenue
}

function calculateOfflineRevenue(orders: number, state: GameState): number {
  const basePrice = calculateAverageOrderPrice(state.hasBeerLicense)
  const adjustment = state.weeklyPriceAdjustments['offline'] || 0
  const effectivePrice = basePrice + adjustment
  return orders * effectivePrice
}

function calculatePrivateDomainRevenue(orders: number, state: GameState): number {
  const basePrice = calculateAverageOrderPrice(state.hasBeerLicense)
  const adjustment = state.weeklyPriceAdjustments['private_domain'] || 0
  let effectivePrice = basePrice + adjustment
  const hasDiscountStrategy = state.privateDomains.some(pd => pd.isActive && pd.strategy === 'discount')
  if (hasDiscountStrategy) {
    effectivePrice = effectivePrice * 0.9
  }
  return orders * effectivePrice
}

function calculateB2BRevenue(merchant: B2BMerchant, state: GameState): number {
  const basePrice = calculateAverageOrderPrice(state.hasBeerLicense)
  const relationConfig = B2B_RELATION_CONFIGS.find((c) => c.level === merchant.relationLevel)
  const modifier = relationConfig?.priceModifier || 0
  return Math.round(merchant.currentWeekOrders * basePrice * (1 + modifier))
}

function processPendingProcurement(state: GameState): InventoryItem[] {
  const newItems: InventoryItem[] = []
  for (const order of state.pendingProcurement) {
    const shelfLife = getShelfLife(order.type, state.gameTime.month)
    newItems.push({
      type: order.type,
      quantity: order.quantity,
      remainingShelfLife: shelfLife,
      channel: order.channel,
    })
  }
  return [...state.inventory, ...newItems]
}

function processExpiredInventory(inventory: InventoryItem[]): {
  newInventory: InventoryItem[]
  expiredItems: InventoryItem[]
} {
  const updated = inventory.map((item) => ({
    ...item,
    remainingShelfLife: item.remainingShelfLife - 1,
  }))

  const expired = updated.filter((item) => item.remainingShelfLife <= 0)
  const valid = updated.filter((item) => item.remainingShelfLife > 0)

  return { newInventory: valid, expiredItems: expired }
}

function generateReview(channel: string, deliveryMethod: string): Review {
  const tags: Record<ReviewTag, 'good' | 'bad'> = {
    delivery_speed: 'good',
    ingredient_freshness: 'good',
    taste: 'good',
  }

  const deliveryBadProb = deliveryMethod === 'self_delivery' ? SELF_DELIVERY_BAD_REVIEW_PROB : 0.2
  tags.delivery_speed = Math.random() < deliveryBadProb ? 'bad' : 'good'
  tags.ingredient_freshness = Math.random() < 0.2 ? 'bad' : 'good'
  tags.taste = Math.random() < 0.25 ? 'bad' : 'good'

  const goodCount = Object.values(tags).filter((v) => v === 'good').length
  const isPositive = goodCount >= 2

  return {
    tags,
    isPositive,
    channel,
    canAppeal: !isPositive,
    isAppealed: false,
  }
}

/**
 * Fix #11: Third breach charges BOTH the fine AND the order amount deduction.
 */
function processB2BBreach(merchant: B2BMerchant): { penalty: number; updatedMerchant: B2BMerchant } {
  const breachConfig = B2B_BREACH_PENALTIES.find(
    (b) => b.breachCount === merchant.breachCount + 1,
  ) || B2B_BREACH_PENALTIES[B2B_BREACH_PENALTIES.length - 1]

  const updated: B2BMerchant = { ...merchant }
  let penalty = 0

  if (breachConfig.terminate) {
    // Fix #11: fine + full order value for termination breach
    const revenue = merchant.currentWeekOrders * merchant.unitPrice
    penalty = breachConfig.fine + revenue
    updated.isActive = false
    updated.cooldownWeeksLeft = 4
    updated.breachCount = 0
  } else {
    const revenue = merchant.currentWeekOrders * merchant.unitPrice
    penalty = Math.round(revenue * breachConfig.deductionRate)
    updated.breachCount = merchant.breachCount + 1

    const currentLevelIndex = B2B_RELATION_CONFIGS.findIndex((c) => c.level === merchant.relationLevel)
    const newLevelIndex = Math.max(0, currentLevelIndex - breachConfig.relationDrop)
    updated.relationLevel = B2B_RELATION_CONFIGS[newLevelIndex].level
  }

  return { penalty, updatedMerchant: updated }
}

function updateB2BRelations(merchant: B2BMerchant): B2BMerchant {
  const updated = { ...merchant }
  updated.fulfilledCount += 1

  const currentConfig = B2B_RELATION_CONFIGS.find((c) => c.level === merchant.relationLevel)
  const currentIndex = B2B_RELATION_CONFIGS.indexOf(currentConfig!)
  const nextLevel = B2B_RELATION_CONFIGS[currentIndex + 1]

  if (nextLevel && updated.fulfilledCount >= nextLevel.fulfilledThreshold) {
    updated.relationLevel = nextLevel.level
  }

  return updated
}

function checkRandomEvent(): { id: string; title: string; description: string; type: 'random_positive' | 'random_negative' } | null {
  if (Math.random() > 0.15) return null

  if (Math.random() < 0.5) {
    const events = RANDOM_POSITIVE_EVENTS
    const event = events[randInt(0, events.length - 1)]
    return { id: event.id, title: event.title, description: event.description, type: event.type as 'random_positive' }
  }
  const events = RANDOM_NEGATIVE_EVENTS
  const event = events[randInt(0, events.length - 1)]
  return { id: event.id, title: event.title, description: event.description, type: event.type as 'random_negative' }
}

function checkInspection(state: GameState): boolean {
  if (!INSPECTION_MONTHS.includes(state.gameTime.month)) return false
  if (state.gameTime.week !== 1 && state.gameTime.week !== 2 && state.gameTime.week !== 3) return false
  return Math.random() < 0.3
}

function calculateInspectionResult(state: GameState): { passed: boolean; fine: number; notifications: string[] } {
  const notifications: string[] = []
  let fine = 0
  let passed = true

  const hasWholesale = state.inventory.some((i) => i.channel === 'wholesale')

  if (hasWholesale && Math.random() < 0.3) {
    fine += 2000
    passed = false
    notifications.push('飞行检查发现批发渠道原料不合格，罚款2000元')
  }

  if (passed) {
    notifications.push('飞行检查通过！')
  }

  return { passed, fine, notifications }
}

/**
 * Fix #9: Victory condition uses accumulated monthlyRevenue (over 4 weeks)
 * which is checked at week 4 before resetting.
 */
export function checkVictoryConditions(state: GameState): boolean {
  if (state.totalCashEarned < VICTORY_CASH_THRESHOLD) return false
  if (state.brandAwareness < VICTORY_BRAND_AWARENESS) return false
  if (state.storeCount < VICTORY_STORE_COUNT) return false
  if (state.monthlyRevenue < VICTORY_MONTHLY_REVENUE) return false
  const patentedHighScore = state.recipes.filter(
    (r) => r.isPatented && r.score >= VICTORY_RECIPE_MIN_SCORE,
  ).length
  if (patentedHighScore < VICTORY_PATENTED_RECIPES) return false
  return true
}

export function checkDefeatConditions(state: GameState): boolean {
  if (state.employees.length === 0 && state.cash < 5000) return true
  if (state.consecutiveLossMonths >= 3) return true
  return false
}

export function calculateTemperatureControlPenalty(shop: Shop, month: number): number {
  const isHotMonth = SUMMER_MONTHS.includes(month) || month === 12 || month <= 2
  if (!isHotMonth) return 0

  const hasAcStore = shop.furniture.some((f) => f.type === 'ac_store' && f.count > 0)
  const hasAcKitchen = shop.furniture.some((f) => f.type === 'ac_kitchen' && f.count > 0)
  const hasFanStore = shop.furniture.some((f) => f.type === 'fan_store' && f.count > 0)
  const hasFanKitchen = shop.furniture.some((f) => f.type === 'fan_kitchen' && f.count > 0)

  const storeOk = hasAcStore || hasFanStore
  const kitchenOk = hasAcKitchen || hasFanKitchen

  if (storeOk && kitchenOk) return 0
  if (!storeOk && !kitchenOk) return randInt(3, 5)
  return randInt(1, 3)
}

function advanceGameTime(time: GameTime): GameTime {
  let { year, month, week } = time
  week += 1
  if (week > 4) {
    week = 1
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return { year, month: month as GameTime['month'], week: week as GameTime['week'] }
}

function generateB2BOrders(merchant: B2BMerchant): B2BMerchant {
  if (!merchant.isActive) return merchant
  const orders = randInt(merchant.minWeeklyOrders, merchant.maxWeeklyOrders)
  return { ...merchant, currentWeekOrders: orders }
}

/**
 * Calculate chicken rack sales from fulfilled orders for utilities tracking.
 * Only main dishes (offline) or 70% of platform orders count as chicken rack sales.
 */
function calculateChickenRackSales(
  _fulfilledOrders: Map<string, number>,
  lastWeekSales: ChannelSales[],
): number {
  let chickenRackSales = 0
  for (const sale of lastWeekSales) {
    const fo = sale.fulfilledOrders ?? 0
    if (sale.channel === 'offline') {
      chickenRackSales += fo
    } else if (sale.channel === 'b2b' || sale.channel === 'private_domain') {
      chickenRackSales += fo
    } else {
      chickenRackSales += Math.round(fo * 0.7)
    }
  }
  return chickenRackSales
}

export function advanceWeek(state: GameState): GameState {
  let s = { ...state }
  s.fulfilledOrders = new Map(state.fulfilledOrders)
  const notifications: string[] = []

  s.weeklyPriceAdjustments = {}
  for (const ch of ['mt', 'sg', 'jd', 'b2b', 'private_domain', 'offline']) {
    s.weeklyPriceAdjustments[ch] = generateWeeklyPriceAdjustment(ch)
  }

  // ---- Step 1: Process pending procurement and hires ----
  s.inventory = processPendingProcurement(s)
  s.pendingProcurement = []

  for (const candidate of s.pendingHires) {
    const employee: Employee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: candidate.name,
      skills: { ...candidate.skills },
      position: 'none',
      salary: candidate.expectedSalary,
      mood: 70,
      isDualRole: false,
      weekHired: s.absoluteWeek,
      baseSalary: undefined,
    }
    s.employees = [...s.employees, employee]
  }
  s.pendingHires = []

  // ---- Step 2: Generate B2B orders for active merchants ----
  s.b2bMerchants = s.b2bMerchants.map(generateB2BOrders)

  // ---- Step 3: Generate orders for all channels ----
  const ordersByChannel: Record<string, number> = {}
  for (const channel of CHANNEL_PRIORITY) {
    ordersByChannel[channel] = generateOrdersForChannel(channel, s)
  }

  if (s.acquiredBrand) {
    for (const channel of CHANNEL_PRIORITY) {
      ordersByChannel[channel] = ordersByChannel[channel] * 10
    }
  }

  // Apply event and marketing bonuses to non-B2B channels
  const eventBonus = getActiveEventBonus(s)
  const marketingBonus = getMarketingBonus(s)
  const hasActiveEvent = s.marketingEvents.some(e => e.isActive)
  for (const channel of CHANNEL_PRIORITY) {
    if (channel === 'b2b') continue
    ordersByChannel[channel] = Math.round(ordersByChannel[channel] * eventBonus * marketingBonus)
  }

  // ---- Step 3b: Auto-allocate orders by channel priority ----
  const { totalCapacity } = calculateKitchenCapacity(s.employees, 0)
  const fulfilledOrders = new Map<string, number>()
  let remainingCapacity = totalCapacity
  const cancelledOrders: Record<string, number> = {}
  const outsourcedOrders: Record<string, number> = {}

  if (s.absoluteWeek === 1) {
    for (const channel of CHANNEL_PRIORITY) {
      const availableOrders = ordersByChannel[channel] || 0
      if (availableOrders > 0) {
        cancelledOrders[channel] = availableOrders
      }
    }
  } else {
    const remainingInventory = new Map<IngredientType, number>()
    for (const item of s.inventory) {
      if (item.remainingShelfLife > 0) {
        remainingInventory.set(item.type as IngredientType, (remainingInventory.get(item.type as IngredientType) || 0) + item.quantity)
      }
    }

    for (const channel of CHANNEL_PRIORITY) {
      const availableOrders = ordersByChannel[channel] || 0
      if (availableOrders <= 0) continue

      const forecast = s.channelOrderForecasts.find(f => f.channel === channel)
      if (forecast?.isOutsourced) {
        fulfilledOrders.set(channel, availableOrders)
        outsourcedOrders[channel] = availableOrders
        continue
      }

      const hasSelfSauce = s.activeRecipeId !== null
      const isPlatform = channel === 'mt' || channel === 'sg' || channel === 'jd'
      const needed = calculateIngredientsForOrders(availableOrders, s.hasBeerLicense, s.isFranchisePeriod, s.enabledSkus, hasActiveEvent, hasSelfSauce, isPlatform)
      let canFulfill = availableOrders

      for (const [type, qty] of Object.entries(needed)) {
        if (!qty || qty <= 0) continue
        const t = type as IngredientType
        let available = remainingInventory.get(t) || 0
        if (available < qty && t === 'self_sauce') {
          available += remainingInventory.get('official_sauce') || 0
        }
        if (available < qty) {
          const fraction = available / qty
          canFulfill = Math.min(canFulfill, Math.max(available > 0 ? 1 : 0, Math.floor(availableOrders * fraction)))
        }
      }

      const allocated = Math.min(canFulfill, remainingCapacity)
      if (allocated > 0) {
        fulfilledOrders.set(channel, allocated)
        remainingCapacity -= allocated

        const allocatedNeeded = calculateIngredientsForOrders(allocated, s.hasBeerLicense, s.isFranchisePeriod, s.enabledSkus, hasActiveEvent, hasSelfSauce, isPlatform)
        for (const [type, qty] of Object.entries(allocatedNeeded)) {
          if (!qty || qty <= 0) continue
          const t = type as IngredientType
          let deductRemaining = qty
          let currentInv = remainingInventory.get(t) || 0
          if (currentInv >= deductRemaining) {
            remainingInventory.set(t, currentInv - deductRemaining)
            deductRemaining = 0
          } else {
            deductRemaining -= currentInv
            remainingInventory.set(t, 0)
          }
          if (deductRemaining > 0 && t === 'self_sauce') {
            let officialInv = remainingInventory.get('official_sauce') || 0
            if (officialInv >= deductRemaining) {
              remainingInventory.set('official_sauce', officialInv - deductRemaining)
              deductRemaining = 0
            } else {
              deductRemaining -= officialInv
              remainingInventory.set('official_sauce', 0)
            }
          }
        }
      }

      if (availableOrders > allocated) {
        cancelledOrders[channel] = availableOrders - allocated
      }
    }
  }

  // ---- Step 4: Calculate total orders for overtime ----
  let totalFulfilledOrders = 0
  for (const [channel, count] of fulfilledOrders) {
    if (!outsourcedOrders[channel]) {
      totalFulfilledOrders += count
    }
  }

  // Fix #3: Only charge overtime when actual orders exceed standard capacity
  const { overtimeCost } = calculateKitchenCapacity(s.employees, totalFulfilledOrders)

  // ---- Step 5: Deduct ingredients for production FIRST ----
  const eventMerchBefore = s.inventory
    .filter(item => item.type === 'event_merch')
    .reduce((sum, item) => sum + item.quantity, 0)

  const nonOutsourcedOrders = new Map<string, number>()
  for (const [channel, count] of fulfilledOrders) {
    if (!outsourcedOrders[channel]) {
      nonOutsourcedOrders.set(channel, count)
    }
  }

  const { newInventory: afterDeduction, shortages } = deductIngredientsFromPlan(
    s.inventory,
    nonOutsourcedOrders,
    s.hasBeerLicense,
    s.isFranchisePeriod,
    s.enabledSkus,
    hasActiveEvent,
    s.activeRecipeId !== null,
  )
  s.inventory = afterDeduction

  const eventMerchAfter = s.inventory
    .filter(item => item.type === 'event_merch')
    .reduce((sum, item) => sum + item.quantity, 0)
  const eventMerchSold = Math.max(0, eventMerchBefore - eventMerchAfter)
  s.lastWeekEventMerchSold = eventMerchSold

  if (shortages.length > 0) {
    notifications.push(`原料不足(${shortages.join('、')})，部分订单无法完成`)
  }

  // ---- Step 6: THEN process expired inventory ----
  const { newInventory: afterExpiry, expiredItems } = processExpiredInventory(s.inventory)
  s.inventory = afterExpiry

  if (expiredItems.length > 0) {
    const expiredNames = expiredItems.map((item) => {
      const config = INGREDIENT_CONFIG_MAP.get(item.type)
      return `${config?.name || item.type}×${item.quantity}`
    })
    notifications.push(`以下原料已过期被丢弃：${expiredNames.join('、')}`)
  }

  // ---- Step 7: Calculate revenue based on fulfilled orders ----
  let totalRevenue = 0
  const lastWeekSales: ChannelSales[] = []
  let outsourceFeeTotal = 0

  // B2B revenue
  let b2bRevenue = s.b2bMerchants
    .filter((m) => m.isActive && fulfilledOrders.has('b2b'))
    .reduce((sum, m) => sum + calculateB2BRevenue(m, s), 0)
  const b2bForecast = s.channelOrderForecasts.find(f => f.channel === 'b2b')
  if (b2bForecast?.isOutsourced) {
    const outsourceFeeRate = b2bForecast.outsourceType === 'emergency' ? 0.95 : 0.90
    outsourceFeeTotal += Math.round(b2bRevenue * outsourceFeeRate)
  }
  if (fulfilledOrders.has('b2b')) {
    totalRevenue += b2bRevenue
    lastWeekSales.push({
      channel: 'b2b',
      orders: ordersByChannel['b2b'] || 0,
      predictedOrders: ordersByChannel['b2b'] || 0,
      actualOrders: ordersByChannel['b2b'] || 0,
      fulfilledOrders: fulfilledOrders.get('b2b') || 0,
      revenue: b2bRevenue,
    })
  }

  // Platform revenue (Fix #4: delegate revenue drop applied in calculatePlatformRevenue)
  let totalDeliveryFee = 0
  for (const pid of PLATFORM_ORDER_RANKING) {
    if (fulfilledOrders.has(pid)) {
      let rev = calculatePlatformRevenue(fulfilledOrders.get(pid)!, pid, s)
      const forecast = s.channelOrderForecasts.find(f => f.channel === pid)
      if (forecast?.isOutsourced) {
        const outsourceFeeRate = forecast.outsourceType === 'emergency' ? 0.95 : 0.90
        outsourceFeeTotal += Math.round(rev * outsourceFeeRate)
      }
      totalRevenue += rev
      const platform = s.platforms.find((p) => p.id === pid)
      if (!outsourcedOrders[pid]) {
        const feePerOrder = platform?.deliveryMethod === 'self_delivery' ? 0.4 : 1
        totalDeliveryFee += fulfilledOrders.get(pid)! * feePerOrder
      }
      lastWeekSales.push({
        channel: pid,
        orders: ordersByChannel[pid] || 0,
        predictedOrders: ordersByChannel[pid] || 0,
        actualOrders: ordersByChannel[pid] || 0,
        fulfilledOrders: fulfilledOrders.get(pid) || 0,
        revenue: rev,
      })
    }
  }
  totalDeliveryFee = Math.round(totalDeliveryFee)

  // Offline revenue
  if (fulfilledOrders.has('offline')) {
    let rev = calculateOfflineRevenue(fulfilledOrders.get('offline')!, s)
    const forecast = s.channelOrderForecasts.find(f => f.channel === 'offline')
    if (forecast?.isOutsourced) {
      const outsourceFeeRate = forecast.outsourceType === 'emergency' ? 0.95 : 0.90
      outsourceFeeTotal += Math.round(rev * outsourceFeeRate)
    }
    totalRevenue += rev
    lastWeekSales.push({
      channel: 'offline',
      orders: ordersByChannel['offline'] || 0,
      predictedOrders: ordersByChannel['offline'] || 0,
      actualOrders: ordersByChannel['offline'] || 0,
      fulfilledOrders: fulfilledOrders.get('offline') || 0,
      revenue: rev,
    })
  }

  // Private domain revenue
  if (fulfilledOrders.has('private_domain')) {
    let rev = calculatePrivateDomainRevenue(fulfilledOrders.get('private_domain')!, s)
    const forecast = s.channelOrderForecasts.find(f => f.channel === 'private_domain')
    if (forecast?.isOutsourced) {
      const outsourceFeeRate = forecast.outsourceType === 'emergency' ? 0.95 : 0.90
      outsourceFeeTotal += Math.round(rev * outsourceFeeRate)
    }
    totalRevenue += rev
    lastWeekSales.push({
      channel: 'private_domain',
      orders: ordersByChannel['private_domain'] || 0,
      predictedOrders: ordersByChannel['private_domain'] || 0,
      actualOrders: ordersByChannel['private_domain'] || 0,
      fulfilledOrders: fulfilledOrders.get('private_domain') || 0,
      revenue: rev,
    })
  }

  // Build weekly revenue detail
  const weeklyRevenueDetail: { item: string; amount: number }[] = []
  for (const sale of lastWeekSales) {
    if (sale.revenue > 0) {
      weeklyRevenueDetail.push({ item: CHANNEL_LABELS[sale.channel] || sale.channel, amount: sale.revenue })
    }
  }

  if (hasActiveEvent && eventMerchSold > 0) {
    const majorEvents: string[] = ['world_cup', 'euro_cup', 'lol_worlds']
    const hasMajorEvent = s.marketingEvents.some(e => e.isActive && majorEvents.includes(e.type))
    const eventBonusMultiplier = hasMajorEvent ? 15 : 5
    const eventBonusRevenue = eventMerchSold * eventBonusMultiplier
    totalRevenue += eventBonusRevenue
    const bonusLabel = hasMajorEvent ? '活动营销增益(大赛)' : '活动营销增益'
    weeklyRevenueDetail.push({ item: bonusLabel, amount: eventBonusRevenue })
    notifications.push(`${bonusLabel}：售出活动周边×${eventMerchSold}，额外收入${fmtMoney(eventBonusRevenue)}元`)
  }

  // ---- Step 8: Generate reviews ----
  const newReviews: Review[] = []
  for (const pid of PLATFORM_ORDER_RANKING) {
    if (!fulfilledOrders.has(pid)) continue
    const platform = s.platforms.find((p) => p.id === pid)
    if (!platform) continue
    const orderCount = fulfilledOrders.get(pid)!
    const reviewCount = Math.max(1, Math.round(orderCount * 0.05))
    const forecast = s.channelOrderForecasts.find(f => f.channel === pid)
    for (let i = 0; i < reviewCount; i++) {
      const review = generateReview(pid, platform.deliveryMethod)
      if (forecast?.isOutsourced && Math.random() < 0.05) {
        review.isPositive = false
        review.tags.taste = 'bad'
      }
      newReviews.push(review)
    }
  }

  // ---- Step 9: Update platforms (ratings, cancellations, suspensions, marketing) ----
  const updatedPlatforms = s.platforms.map((p) => {
    const updated = { ...p }
    const channelCancelled = cancelledOrders[p.id] || 0
    if (p.weekJoined && s.absoluteWeek <= p.weekJoined + 1) {
      // first two weeks on platform: grace period, don't count cancellations
    } else {
      updated.cancelledOrders += channelCancelled
    }

    // Handle suspension from too many cancelled orders
    if (updated.cancelledOrders >= CANCELLED_ORDER_THRESHOLD && !updated.isSuspended) {
      updated.isSuspended = true
      updated.suspensionWeeksLeft = SUSPENSION_WEEKS
      notifications.push(`${updated.name}因取消订单过多被暂停${SUSPENSION_WEEKS}周`)
    }

    // Handle suspension countdown
    if (updated.isSuspended) {
      updated.suspensionWeeksLeft -= 1
      if (updated.suspensionWeeksLeft <= 0) {
        updated.isSuspended = false
        updated.suspensionWeeksLeft = 0
        updated.cancelledOrders = 0
        notifications.push(`${updated.name}已恢复运营`)
      }
    }

    // Fix #5: Delegate marketing cost rise - add to extraMarketingCost instead of rating
    if (updated.marketingActive && updated.isDelegated) {
      if (Math.random() < DELEGATE_MARKETING_RISE_PROBABILITY) {
        const rise = randFloat(DELEGATE_MARKETING_RISE_RANGE[0], DELEGATE_MARKETING_RISE_RANGE[1])
        updated.extraMarketingCost = MARKETING_INVESTMENT_PER_WEEK * rise
      } else {
        updated.extraMarketingCost = 0
      }
    } else {
      updated.extraMarketingCost = 0
    }

    // Fix #1: Rating precision - use parseFloat toFixed(2) instead of Math.round
    const positiveReviews = newReviews.filter((r) => r.channel === p.id && r.isPositive).length
    const negativeReviews = newReviews.filter((r) => r.channel === p.id && !r.isPositive).length
    const reviewDelta = (positiveReviews * 0.02) - (negativeReviews * 0.05)
    updated.rating = parseFloat(
      Math.max(1, Math.min(5, updated.rating + reviewDelta)).toFixed(2),
    )

    return updated
  })
  s.platforms = updatedPlatforms

  // ---- Step 10: Handle B2B relations/breaches ----
  // Fix #13: Handle B2B breach for any B2B orders not in fulfilledOrders
  let b2bPenalties = 0
  const updatedMerchants = s.b2bMerchants.map((merchant) => {
    if (!merchant.isActive) {
      if (merchant.cooldownWeeksLeft > 0) {
        return { ...merchant, cooldownWeeksLeft: merchant.cooldownWeeksLeft - 1 }
      }
      return merchant
    }

    const b2bFulfilled = fulfilledOrders.has('b2b')
    if (b2bFulfilled) {
      const updated = updateB2BRelations(merchant)
      if (updated.relationLevel !== merchant.relationLevel) {
        notifications.push(`${merchant.name}关系升级为${updated.relationLevel}`)
      }
      return updated
    }

    const { penalty, updatedMerchant } = processB2BBreach(merchant)
    b2bPenalties += penalty
    if (penalty > 0) {
      notifications.push(`${merchant.name}违约，罚款${fmtMoney(penalty)}元`)
    }
    if (updatedMerchant.isActive === false) {
      notifications.push(`${merchant.name}因多次违约终止合作`)
    }
    return updatedMerchant
  })
  s.b2bMerchants = updatedMerchants
  totalRevenue -= b2bPenalties

  // ---- Step 11: Calculate expenses ----
  const activeB2BCount = s.b2bMerchants.filter((m) => m.isActive).length
  const b2bDeliveryFees = activeB2BCount * B2B_DELIVERY_FEE_PER_MERCHANT
  const totalMarketingCost = s.platforms.filter((p) => p.isJoined && p.marketingActive).length * MARKETING_INVESTMENT_PER_WEEK
    + s.platforms.reduce((sum, p) => sum + (p.extraMarketingCost || 0), 0)

  let monthlyRent = 0
  let monthlySalaries = 0
  let monthlyUtilities = 0
  if (s.gameTime.week === 1) {
    if (s.absoluteWeek > 4) {
      monthlySalaries = s.employees.reduce((sum, e) => sum + e.salary, 0)
      monthlyUtilities = Math.round(s.lastMonthOrders * 0.05)
    }
    if (s.gameTime.year > 1 || s.gameTime.month >= 5) {
      monthlyRent = s.shop.rent
    }
    s.lastMonthOrders = 0
    s.lastMonthOnlineOrders = 0
    s.lastMonthOfflineOrders = 0
    s.lastMonthBadReviews = 0
    s.lastMonthMarketingActive = false
  }

  const thisWeekOnlineOrders = (fulfilledOrders.get('mt') || 0) + (fulfilledOrders.get('sg') || 0) + (fulfilledOrders.get('jd') || 0)
  const thisWeekOfflineOrders = fulfilledOrders.get('offline') || 0
  let thisWeekTotalOrders = 0
  for (const [, count] of fulfilledOrders) thisWeekTotalOrders += count
  const thisWeekBadReviews = newReviews.filter(r => !r.isPositive && !r.isAppealed).length
  const anyMarketingActive = s.platforms.some(p => p.isJoined && p.marketingActive)
  s.lastMonthOrders += thisWeekTotalOrders
  s.lastMonthOnlineOrders += thisWeekOnlineOrders
  s.lastMonthOfflineOrders += thisWeekOfflineOrders
  s.lastMonthBadReviews += thisWeekBadReviews
  if (anyMarketingActive) s.lastMonthMarketingActive = true

  const weeklyExpenses = b2bDeliveryFees + totalMarketingCost + overtimeCost + totalDeliveryFee + s.weeklyProcurementCost + outsourceFeeTotal
  const monthlyExpenses = monthlyRent + monthlySalaries + monthlyUtilities
  const netIncome = totalRevenue - weeklyExpenses - monthlyExpenses

  const weeklyExpensesDetail: { item: string; amount: number }[] = []
  if (s.weeklyProcurementCost > 0) weeklyExpensesDetail.push({ item: '采购原料', amount: s.weeklyProcurementCost })
  if (b2bDeliveryFees > 0) weeklyExpensesDetail.push({ item: 'B2B配送费', amount: b2bDeliveryFees })
  if (totalMarketingCost > 0) weeklyExpensesDetail.push({ item: '营销推广', amount: totalMarketingCost })
  if (overtimeCost > 0) weeklyExpensesDetail.push({ item: '加班费', amount: overtimeCost })
  if (totalDeliveryFee > 0) weeklyExpensesDetail.push({ item: '配送费', amount: totalDeliveryFee })
  if (outsourceFeeTotal > 0) weeklyExpensesDetail.push({ item: '外包费用', amount: outsourceFeeTotal })

  const monthlyExpensesDetail: { item: string; amount: number }[] = []
  if (monthlyRent > 0) monthlyExpensesDetail.push({ item: '房租(月付)', amount: monthlyRent })
  if (monthlySalaries > 0) monthlyExpensesDetail.push({ item: '员工工资(月付)', amount: monthlySalaries })
  if (monthlyUtilities > 0) monthlyExpensesDetail.push({ item: '水电费(月付)', amount: monthlyUtilities })

  s.cash += netIncome
  s.totalCashEarned += Math.max(0, totalRevenue)
  s.weeklyRevenue = totalRevenue
  s.weeklyExpenses = weeklyExpenses + monthlyExpenses
  s.weeklyRevenueDetail = weeklyRevenueDetail
  s.weeklyExpensesDetail = weeklyExpensesDetail

  // ---- Loan repayment ----
  const overdueLoans = s.activeLoans.filter(l => s.absoluteWeek >= l.dueWeek)
  if (overdueLoans.length > 0) {
    const totalOverdue = overdueLoans.reduce((sum, l) => sum + l.amount, 0)
    if (s.cash >= totalOverdue) {
      s.cash -= totalOverdue
      s.activeLoans = s.activeLoans.filter(l => s.absoluteWeek < l.dueWeek)
      notifications.push(`已自动偿还到期借款${fmtMoney(totalOverdue)}元`)
    } else {
      s.gamePhase = 'game_over'
      notifications.push('借款到期未还，店铺被清算...')
      return s
    }
  }
  const dueSoonLoans = s.activeLoans.filter(l => l.dueWeek - s.absoluteWeek <= 4 && l.dueWeek - s.absoluteWeek > 0)
  for (const loan of dueSoonLoans) {
    notifications.push(`⚠️ ${loan.source}的借款${fmtMoney(loan.amount)}元将在${loan.dueWeek - s.absoluteWeek}周后到期！`)
  }
  s.monthlyExpensesDetail = monthlyExpensesDetail
  s.totalRevenue += totalRevenue
  s.totalExpenses += weeklyExpenses + monthlyExpenses

  // Bankruptcy rescue
  if (s.cash < 0) {
    s.bankruptcyCount += 1
    if (s.bankruptcyCount >= MAX_BANKRUPTCIES) {
      s.gamePhase = 'game_over'
      notifications.push('资金耗尽，店铺倒闭...')
      return s
    }
    const loanSource = s.bankruptcyCount === 1 ? '总部' : '朋友'
    const dueWeek = s.absoluteWeek + BANKRUPTCY_LOAN_REPAY_WEEKS
    s.cash += BANKRUPTCY_LOAN_AMOUNT
    s.activeLoans.push({
      source: loanSource,
      amount: BANKRUPTCY_LOAN_AMOUNT,
      dueWeek,
    })
    notifications.push(`【剧情】${loanSource}借给你${fmtMoney(BANKRUPTCY_LOAN_AMOUNT)}元，需在1年内还款`)

    if (s.bankruptcyCount === 1) {
      s.pendingBankruptcyStory = '你的店铺入不敷出，账上已经没钱了。就在你准备关店的时候，总部打来了电话。"小老弟，听说你遇到困难了？这样吧，总部借你五万块，利息就免了。不过你得在一年内还清，否则……"你感激地接受了这笔救命钱。总部经理临挂电话前说了一句："记住，这行靠的是坚持。"有了这五万块，你重新燃起了希望。但你知道，时间不等人——一年之内，你必须扭亏为盈，否则等待你的将是更深的深渊。'
    } else if (s.bankruptcyCount === 2) {
      s.pendingBankruptcyStory = '又是一次资金危机。这一次，总部不会再借了。你翻遍通讯录，终于鼓起勇气拨通了老友的电话。"兄弟，能不能借我五万？我保证一年内还你。"电话那头沉默了几秒，然后传来一声叹息："行吧，谁让咱是兄弟呢。但你记住，这是最后一次了。"你握着手机，眼眶有些湿润。这一次，你暗下决心——绝不会再有下一次。如果再倒下，就真的什么都没有了。'
    }
  }

  // Fix #9: Accumulate monthly revenue over 4 weeks for victory check
  s.monthlyRevenue += totalRevenue
  s.monthlyExpenses += weeklyExpenses

  // ---- Step 12: Fix #2 - Accumulate chicken rack sales BEFORE monthly settlement ----
  // Calculate this week's chicken rack sales and add to running total
  const currentWeekChickenRackSales = calculateChickenRackSales(fulfilledOrders, lastWeekSales)
  s.lastMonthChickenRackSales += currentWeekChickenRackSales

  // ---- Step 13: Handle monthly settlement at week 4 ----
  if (s.gameTime.week === 4) {
    if (s.monthlyRevenue < s.monthlyExpenses) {
      s.consecutiveLossMonths += 1
    } else {
      s.consecutiveLossMonths = 0
    }
    s.monthlyRevenue = 0
    s.monthlyExpenses = 0
  }

  // Dianping Must-Eat List (calculated at week 1, based on last month's data)
  if (s.gameTime.week === 1 && s.absoluteWeek > 4) {
    const playerScore = Math.round((8.0 + Math.random() * 2.0) * 10) / 10

    function getBonusText(rank: number, score: number): string {
      if (score < 9.0) return '未上榜'
      if (rank === 1) return '下个月外卖优惠券和折扣平台全额补贴，商家无需承担'
      if (rank >= 2 && rank <= 4 && score >= 9.5) return '下月到店单量+15%，外卖平台单量+5%'
      if (rank >= 5 && score >= 9.1) return '下月到店单量+10%，外卖平台单量+5%'
      if (score >= 9.0) return '下月到店单量+10%'
      return '未上榜'
    }

    const otherNames = ['老王烧烤', '小李面馆', '张姐麻辣烫', '赵哥火锅', '陈记饺子', '黄焖鸡米饭', '沙县小吃', '兰州拉面', '重庆小面', '正新鸡排']

    if (playerScore < 9.0) {
      const top10: { name: string; score: number }[] = []
      for (let i = 0; i < 10; i++) {
        const score = Math.round((9.0 + Math.random() * 1.0) * 10) / 10
        top10.push({ name: otherNames[i], score: Math.min(10.0, score) })
      }
      top10.sort((a, b) => b.score - a.score)

      s.dianpingRanking = [
        ...top10.map((shop, i) => ({
          name: shop.name,
          score: shop.score,
          bonus: getBonusText(i + 1, shop.score),
        })),
        { name: `${s.shopName || '鸡架'}鸡架店`, score: playerScore, bonus: '未上榜' },
      ]
      s.dianpingRank = null
      s.dianpingBonus = null
    } else {
      const otherShops: { name: string; score: number }[] = []
      for (let i = 0; i < 9; i++) {
        const score = Math.round((9.0 + Math.random() * 1.0) * 10) / 10
        otherShops.push({ name: otherNames[i], score: Math.min(10.0, score) })
      }

      const allShops = [...otherShops, { name: `${s.shopName || '鸡架'}鸡架店`, score: playerScore }]
      allShops.sort((a, b) => b.score - a.score)

      const playerRank = allShops.findIndex(shop => shop.name === `${s.shopName || '鸡架'}鸡架店`) + 1
      s.dianpingScore = playerScore
      s.dianpingRank = playerRank

      if (playerRank === 1) {
        s.dianpingBonus = '第一名：下个月外卖优惠券和折扣平台全额补贴，商家无需承担'
      } else if (playerRank >= 2 && playerRank <= 4 && playerScore >= 9.5) {
        s.dianpingBonus = `第${playerRank}名：下月到店单量+15%，外卖平台单量+5%`
      } else if (playerRank >= 5 && playerScore >= 9.1) {
        s.dianpingBonus = `第${playerRank}名：下月到店单量+10%，外卖平台单量+5%`
      } else if (playerScore >= 9.0) {
        s.dianpingBonus = `第${playerRank}名：下月到店单量+10%`
      } else {
        s.dianpingBonus = null
      }

      s.dianpingRanking = allShops.map((shop, i) => ({
        name: shop.name,
        score: shop.score,
        bonus: getBonusText(i + 1, shop.score),
      }))
    }

    if (s.dianpingRank) {
      notifications.push(`📊 大众点评必吃榜：你的店铺得分${playerScore}分，排名第${s.dianpingRank}`)
    } else {
      notifications.push(`📊 大众点评必吃榜：你的店铺得分${playerScore}分，未上榜`)
    }
    if (s.dianpingBonus) {
      notifications.push(`🏆 ${s.dianpingBonus}`)
    }
  }

  // ---- Step 14: Update employee moods, handle resignations ----
  const resignedEmployeeIds: string[] = []
  const internResignedIds: string[] = []
  s.employees = s.employees.map((emp) => {
    const moodChange = calculateMoodChange(emp, s.shop, s.gameTime.month)
    const newMood = Math.max(0, Math.min(100, emp.mood + moodChange))

    if (emp.isDualRole && Math.random() < DUAL_ROLE_COMPLAINT_PROBABILITY) {
      notifications.push(`${emp.name}因身兼两职产生抱怨`)
    }

    if (emp.isIntern) {
      if (newMood <= MOOD_RESIGN_THRESHOLD && Math.random() < 0.5) {
        internResignedIds.push(emp.id)
      }
      return { ...emp, mood: newMood }
    }

    if (shouldResign({ ...emp, mood: newMood })) {
      resignedEmployeeIds.push(emp.id)
      return { ...emp, mood: newMood }
    }

    return { ...emp, mood: newMood }
  })

  if (internResignedIds.length > 0) {
    const internNames = s.employees
      .filter((e) => internResignedIds.includes(e.id))
      .map((e) => e.name)
    s.employees = s.employees.filter((e) => !internResignedIds.includes(e.id))
    notifications.push(`${internNames.join('、')}实习生离职了`)
  }

  if (resignedEmployeeIds.length > 0) {
    const resignedNames = s.employees
      .filter((e) => resignedEmployeeIds.includes(e.id))
      .map((e) => e.name)
    s.employees = s.employees.filter((e) => !resignedEmployeeIds.includes(e.id))
    notifications.push(`${resignedNames.join('、')}因心情低落辞职了`)
  }

  // Private domain follower growth
  const updatedPrivateDomains = s.privateDomains.map(pd => {
    if (!pd.isActive) return pd
    const delegate = pd.isDelegated && pd.delegatedEmployeeId
      ? s.employees.find(e => e.id === pd.delegatedEmployeeId)
      : null
    const hasGoodDelegate = delegate && delegate.skills.speechcraft >= 9
    const growthInterval = hasGoodDelegate ? 2 : 4
    const shouldGrow = s.absoluteWeek % growthInterval === 0
    if (shouldGrow) {
      let growthRate = 0.05
      if (pd.strategy === 'membership') {
        growthRate = 0.055
      }
      const activeRecipe = s.recipes.find(r => r.id === s.activeRecipeId)
      const selfSauceFanBonus = (activeRecipe && activeRecipe.score >= 8 && s.leftFranchise) ? 0.15 : 0
      const growth = Math.round(pd.followerCount * growthRate * (1 + selfSauceFanBonus))
      return { ...pd, followerCount: pd.followerCount + Math.max(1, growth) }
    }
    return pd
  })
  s.privateDomains = updatedPrivateDomains

  const hasFeedbackStrategy = s.privateDomains.some(pd => pd.isActive && pd.strategy === 'feedback')
  if (hasFeedbackStrategy) {
    s.brandAwareness = Math.min(100, s.brandAwareness + 5)
  }

  if (s.gameTime.year >= 2 && s.gameTime.month === 1 && s.gameTime.week === 1) {
    const inspectionFee = 5000
    s.cash -= inspectionFee
    notifications.push(`年度设备检修费${fmtMoney(inspectionFee)}元已扣除`)
  }

  // ---- Step 15: Check random events, inspections ----
  const randomEvent = checkRandomEvent()
  if (randomEvent) {
    notifications.push(`${randomEvent.title}：${randomEvent.description}`)
    if (randomEvent.type === 'random_positive') {
      s.brandAwareness = Math.min(100, s.brandAwareness + randInt(1, 3))
    } else {
      s.brandAwareness = Math.max(0, s.brandAwareness - randInt(1, 3))
    }
  }

  if (checkInspection(s)) {
    const { fine, notifications: inspNotes } = calculateInspectionResult(s)
    s.cash -= fine
    notifications.push(...inspNotes)
  }

  const triggeredStory = s.storyEvents.find((e) => e.triggerWeek === s.absoluteWeek && e.type === 'main')
  if (triggeredStory) {
    notifications.push(`【主线】${triggeredStory.title}：${triggeredStory.description}`)
  }

  if (s.absoluteWeek === 1) {
    s.isFranchisePeriod = true
    notifications.push('加盟期开始，使用官方配方经营')
  }

  if (s.isFranchisePeriod && s.patentedRecipeCount >= 1 && s.activeRecipeId) {
    const activeRecipe = s.recipes.find((r) => r.id === s.activeRecipeId)
    if (activeRecipe && !activeRecipe.sauces.hasOwnProperty('official_only')) {
      notifications.push('提示：你已有专利配方，可考虑脱离加盟独立经营')
    }
  }

  // Fix #8: Use DIRECT_STORE_WEEK constant instead of hardcoded 53
  if (s.absoluteWeek === DIRECT_STORE_WEEK) {
    s.pendingDirectStoreStory = 'true'
  }

  // ---- Step 16: Update titles ----
  const newTitles = [...s.titles]
  if (s.watchPartyActive && !newTitles.includes('观赛圣地')) newTitles.push('观赛圣地')
  if (s.totalOutsourceCount >= 10 && !newTitles.includes('外包达人')) newTitles.push('外包达人')
  if (s.totalInternsHired >= 10 && !newTitles.includes('实习证明')) newTitles.push('实习证明')
  const weeklyOnlineOrders = s.platforms.filter(p => p.isJoined).reduce((sum, p) => {
    const forecast = s.channelOrderForecasts.find(f => f.channel === p.id)
    return sum + (forecast?.orders || 0)
  }, 0)
  if (weeklyOnlineOrders > 2000 && !newTitles.includes('专做外卖')) newTitles.push('专做外卖')
  const cashTitles = TITLE_THRESHOLDS.filter(
    (t) => s.totalCashEarned >= t.cashThreshold,
  ).map((t) => t.name)
  for (const t of cashTitles) {
    if (!newTitles.includes(t)) newTitles.push(t)
  }
  s.titles = newTitles
  if (!s.currentTitle && newTitles.length > 0) s.currentTitle = newTitles[0]

  // Decrement outsource weeks
  s.channelOrderForecasts = s.channelOrderForecasts.map(f => {
    if (!f.isOutsourced) return f
    if (f.outsourceType === 'emergency') {
      const weeksLeft = (f.outsourceWeeksLeft || 1) - 1
      if (weeksLeft <= 0) {
        return { ...f, isOutsourced: false, outsourceType: undefined, outsourceWeeksLeft: undefined }
      }
      return { ...f, outsourceWeeksLeft: weeksLeft }
    }
    if (f.outsourceType === 'longterm') {
      const weeksLeft = (f.outsourceWeeksLeft || 12) - 1
      if (weeksLeft <= 0) {
        return { ...f, outsourceWeeksLeft: 0 }
      }
      return { ...f, outsourceWeeksLeft: weeksLeft }
    }
    return f
  })

  // ---- Step 17: Check victory/defeat ----
  if (s.leftFranchise && !s.acquiredBrand && s.cash >= 500000) {
    s.pendingAcquireStory = 'true'
  }

  if (s.acquiredBrand && s.acquiredBrandWeek && s.absoluteWeek >= s.acquiredBrandWeek + 12) {
    if (s.cash >= 0) {
      s.gamePhase = 'victory'
      if (!s.titles.includes('鸡架之王')) s.titles.push('鸡架之王')
      s.currentTitle = '鸡架之王'
      notifications.push('🏆 收购品牌3个月经营成功，获得称号【鸡架之王】！')
    }
  }

  if (checkVictoryConditions(s)) {
    s.gamePhase = 'victory'
    notifications.push('恭喜！你已达成胜利条件！')
  } else if (checkDefeatConditions(s)) {
    s.gamePhase = 'game_over'
    notifications.push('经营失败，游戏结束')
  }

  // ---- Step 18: Advance game time ----
  const newTime = advanceGameTime(s.gameTime)
  s.gameTime = newTime
  s.absoluteWeek = getWeekNumber(newTime)

  // Check loan repayment
  for (const loan of s.activeLoans) {
    if (s.absoluteWeek >= loan.dueWeek) {
      s.cash -= loan.amount
      notifications.push(`【还款】向${loan.source}的借款${fmtMoney(loan.amount)}元已到期还款`)
    }
  }
  s.activeLoans = s.activeLoans.filter(loan => s.absoluteWeek < loan.dueWeek)

  // ---- Step 19: Reset stamina ----
  s.stamina = { ...s.stamina, current: s.stamina.max }
  s.weeklyProcurementCost = 0

  // ---- Step 20: Fix #12 - Reset platform/private domain operation stamina flags ----
  s.platformOperationStaminaUsed = false
  s.privateDomainOperationStaminaUsed = false

  // ---- Step 21: Fix #14 - Generate forecasts for next week ----
  const previousOutsourceState = new Map<string, { isOutsourced?: boolean; outsourceType?: 'emergency' | 'longterm'; outsourceWeeksLeft?: number }>()
  for (const f of s.channelOrderForecasts) {
    if (f.isOutsourced) {
      previousOutsourceState.set(f.channel, { isOutsourced: f.isOutsourced, outsourceType: f.outsourceType, outsourceWeeksLeft: f.outsourceWeeksLeft })
    }
  }
  s.channelOrderForecasts = generateChannelOrderForecasts(ordersByChannel, s.hasBeerLicense, s.isFranchisePeriod, s.weeklyPriceAdjustments, s.enabledSkus, hasActiveEvent, s.activeRecipeId !== null)
  for (const forecast of s.channelOrderForecasts) {
    const prev = previousOutsourceState.get(forecast.channel)
    if (prev) {
      forecast.isOutsourced = prev.isOutsourced
      forecast.outsourceType = prev.outsourceType
      forecast.outsourceWeeksLeft = prev.outsourceWeeksLeft
    }
  }

  // ---- Step 22: Reset fulfilledOrders to empty Map ----
  s.fulfilledOrders = new Map()

  // ---- Final state updates ----
  s.reviews = [...s.reviews, ...newReviews]
  s.cancelledOrdersByChannel = cancelledOrders
  s.lastWeekSales = lastWeekSales
  s.notifications = [...s.notifications, ...notifications]

  return s
}
