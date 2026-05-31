import { createContext, useContext, useReducer } from 'react'
import type { ReactNode, Dispatch } from 'react'
import type {
  GameState,
  WeekPhase,
  IngredientType,
  ProcurementChannel,
  Position,
  SauceType,
  SauceLevel,
  PlatformId,
  PrivateDomainChannel,
  PrivateDomainStrategy,
  B2BMerchantType,
  FurnitureType,
  Candidate,
  B2BMerchant,
  Skill,
  Employee,
} from '../types'
import {
  createInitialState,
  INGREDIENT_CONFIG_MAP,
  FURNITURE_CONFIG_MAP,
  SHOP_CONFIG,
  RECIPE_RESEARCH_COST,
  HIRE_COST,
  BARGAIN_REJECTION_PROBABILITY,
  CANDIDATE_COUNT_RANGE,
  PLATFORM_OPERATION_STAMINA_COST,
  PRIVATE_DOMAIN_OPERATION_STAMINA_COST,
  getShelfLife,
  EVENT_SCHEDULES,
  INTERN_NAMES,
} from './constants'
import { advanceWeek } from './GameEngine'
import { fmtMoney } from '../utils/format'
import { scoreRecipe, generateRecipeName } from '../systems/RecipeSystem'
import { generateCandidates, calculateBargainSalary } from '../systems/PersonnelSystem'
import { saveGame, loadGame } from '../systems/SaveManager'

const SKILL_NAME_MAP: Record<string, string> = { speechcraft: '口才', patience: '耐心', stamina_skill: '体力', carefulness: '细心', speed: '速度' }

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export type GameAction =
  | { type: 'SET_WEEK_PHASE'; payload: WeekPhase }
  | { type: 'ADVANCE_WEEK' }
  | { type: 'PURCHASE_INGREDIENTS'; payload: { ingredientType: IngredientType; quantity: number; channel: ProcurementChannel; unitPrice: number } }
  | { type: 'BATCH_PURCHASE_INGREDIENTS'; payload: { items: { ingredientType: IngredientType; quantity: number; channel: ProcurementChannel; unitPrice: number }[] } }
  | { type: 'RECRUIT_EMPLOYEES' }
  | { type: 'HIRE_EMPLOYEE'; payload: { candidateId: string; bargain: boolean } }
  | { type: 'FIRE_EMPLOYEE'; payload: { employeeId: string } }
  | { type: 'ASSIGN_POSITION'; payload: { employeeId: string; position: Position } }
  | { type: 'TOGGLE_DUAL_ROLE'; payload: { employeeId: string } }
  | { type: 'RESEARCH_RECIPE'; payload: Record<SauceType, SauceLevel> }
  | { type: 'PATENT_RECIPE'; payload: { recipeId: string } }
  | { type: 'SET_ACTIVE_RECIPE'; payload: { recipeId: string } }
  | { type: 'JOIN_PLATFORM'; payload: { platformId: PlatformId } }
  | { type: 'LEAVE_PLATFORM'; payload: { platformId: PlatformId } }
  | { type: 'TOGGLE_PLATFORM_DELEGATION'; payload: { platformId: PlatformId } }
  | { type: 'SET_DELIVERY_METHOD'; payload: { platformId: PlatformId; method: 'platform_rider' | 'self_delivery' } }
  | { type: 'TOGGLE_PLATFORM_MARKETING'; payload: { platformId: PlatformId } }
  | { type: 'ACTIVATE_PRIVATE_DOMAIN'; payload: { channel: PrivateDomainChannel } }
  | { type: 'DELEGATE_PRIVATE_DOMAIN'; payload: { channel: PrivateDomainChannel; employeeId: string | null } }
  | { type: 'EXPAND_B2B' }
  | { type: 'SIGN_B2B_CONTRACT'; payload: { merchantType: B2BMerchantType } }
  | { type: 'BUY_FURNITURE'; payload: { furnitureType: FurnitureType } }
  | { type: 'EXPAND_SHOP' }
  | { type: 'BUILD_FLOOR2' }
  | { type: 'GET_BEER_LICENSE' }
  | { type: 'PLAN_MARKETING' }
  | { type: 'APPEAL_REVIEW'; payload: { reviewIndex: number } }
  | { type: 'APPEAL_ALL_REVIEWS' }
  | { type: 'COMMUNICATE_HQ' }
  | { type: 'DISCARD_EXPIRED'; payload: { inventoryIndex: number } }
  | { type: 'USE_EXPIRED'; payload: { inventoryIndex: number } }
  | { type: 'DISMISS_NOTIFICATION'; payload: { index: number } }
  | { type: 'START_GAME' }
  | { type: 'LOAD_STATE'; payload: GameState }
  | { type: 'SET_CANDIDATES'; payload: Candidate[] }
  | { type: 'SET_AVAILABLE_B2B'; payload: B2BMerchant[] }
  | { type: 'PLATFORM_OPERATION'; payload: { platformId: PlatformId } }
  | { type: 'PRIVATE_DOMAIN_OPERATION'; payload: { channel: PrivateDomainChannel } }
  | { type: 'COMPLETE_TUTORIAL_STEP'; payload: { week: number } }
  | { type: 'DECLARE_INDEPENDENCE' }
  | { type: 'DISMISS_BANKRUPTCY_STORY' }
  | { type: 'TALK_TO_EMPLOYEE'; payload: { employeeId: string } }
  | { type: 'PUSH_EMPLOYEE'; payload: { employeeId: string } }
  | { type: 'DISMISS_TUTORIAL' }
  | { type: 'SAVE_GAME'; payload: { slot: number } }
  | { type: 'SET_SHOP_NAME'; payload: { name: string } }
  | { type: 'LOAD_SAVE'; payload: { slot: number } }
  | { type: 'DISMISS_TALENT_SUBSIDY' }
  | { type: 'REPAY_LOAN'; payload: { loanIndex: number } }
  | { type: 'TOGGLE_SKU_FRANCHISE'; payload: { skuId: string } }
  | { type: 'TOGGLE_SKU_INDEPENDENT'; payload: { skuId: string } }
  | { type: 'SET_PRIVATE_DOMAIN_STRATEGY'; payload: { channel: PrivateDomainChannel; strategy: PrivateDomainStrategy } }
  | { type: 'REPAIR_FURNITURE'; payload: { furnitureType: FurnitureType } }
  | { type: 'STOP_MARKETING'; payload: { eventType: string } }
  | { type: 'HIRE_INTERN' }
  | { type: 'OUTSOURCE_CHANNEL'; payload: { channel: string; outsourceType: 'emergency' | 'longterm' } }
  | { type: 'TOGGLE_WATCH_PARTY'; payload: { eventType: string } }
  | { type: 'CYCLE_TITLE' }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_WEEK_PHASE':
      return { ...state, weekPhase: action.payload }

    case 'ADVANCE_WEEK': {
      return advanceWeek(state)
    }

    case 'PURCHASE_INGREDIENTS': {
      const { ingredientType, quantity, channel, unitPrice } = action.payload
      if (state.stamina.current < 1) return state
      let discount = 1
      if (quantity >= 1200) discount = 0.8
      else if (quantity >= 800) discount = 0.9
      const cost = Math.round(unitPrice * quantity * discount)
      if (state.cash < cost) return state
      const shelfLife = getShelfLife(ingredientType, state.gameTime.month)
      return {
        ...state,
        cash: state.cash - cost,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        weeklyProcurementCost: state.weeklyProcurementCost + cost,
        inventory: [...state.inventory, { type: ingredientType, quantity, remainingShelfLife: shelfLife, channel }],
        notifications: [...state.notifications, `采购${INGREDIENT_CONFIG_MAP.get(ingredientType)?.name ?? ingredientType}×${quantity}，花费${fmtMoney(cost)}元`],
      }
    }

    case 'BATCH_PURCHASE_INGREDIENTS': {
      if (state.stamina.current < 1) return state
      let totalCost = 0
      let anyItemDiscounted = false
      for (const item of action.payload.items) {
        let discount = 1
        if (item.quantity >= 1200) discount = 0.8
        else if (item.quantity >= 800) discount = 0.9
        if (discount < 1) anyItemDiscounted = true
        totalCost += Math.round(item.unitPrice * item.quantity * discount)
      }
      if (!anyItemDiscounted && totalCost >= 12000) {
        totalCost = Math.round(totalCost * 0.9)
      }
      if (state.cash < totalCost) return state
      const newItems = action.payload.items.map(item => ({
        type: item.ingredientType,
        quantity: item.quantity,
        remainingShelfLife: getShelfLife(item.ingredientType, state.gameTime.month),
        channel: item.channel,
      }))
      return {
        ...state,
        cash: state.cash - totalCost,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        weeklyProcurementCost: state.weeklyProcurementCost + totalCost,
        inventory: [...state.inventory, ...newItems],
        notifications: [...state.notifications, `批量采购${action.payload.items.length}种原料，花费${fmtMoney(totalCost)}元`],
      }
    }

    case 'RECRUIT_EMPLOYEES': {
      if (state.stamina.current < 1) return state
      if (state.cash < HIRE_COST) return state
      const regularCount = state.employees.filter(e => !e.isIntern).length
      if (regularCount >= state.shop.maxStaff) {
        return { ...state, notifications: [...state.notifications, '正式员工已达上限，无法继续招募'] }
      }
      const count = randInt(CANDIDATE_COUNT_RANGE[0], CANDIDATE_COUNT_RANGE[1])
      const candidates = generateCandidates(count)
      return {
        ...state,
        cash: state.cash - HIRE_COST,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        pendingHires: candidates,
        notifications: [...state.notifications, `花费${fmtMoney(HIRE_COST)}元招募，获得${candidates.length}名候选人`],
      }
    }

    case 'HIRE_EMPLOYEE': {
      const candidate = state.pendingHires.find(c => c.id === action.payload.candidateId)
      if (!candidate) return state

      const salary = action.payload.bargain
        ? calculateBargainSalary(candidate.expectedSalary)
        : candidate.expectedSalary

      if (action.payload.bargain && Math.random() < BARGAIN_REJECTION_PROBABILITY) {
        return {
          ...state,
          notifications: [...state.notifications, `${candidate.name}拒绝了砍价`],
        }
      }

      const hired: Candidate = { ...candidate, expectedSalary: salary }
      return {
        ...state,
        pendingHires: state.pendingHires.filter(c => c.id !== action.payload.candidateId),
        notifications: [...state.notifications, `${candidate.name}已雇佣，下周到岗，月薪${fmtMoney(salary)}元`],
      }
    }

    case 'FIRE_EMPLOYEE': {
      const emp = state.employees.find(e => e.id === action.payload.employeeId)
      if (!emp) return state
      if (emp.isIntern) {
        return {
          ...state,
          employees: state.employees.filter(e => e.id !== action.payload.employeeId),
          notifications: [...state.notifications, `实习生${emp.name}已辞退，无需支付遣散费`],
        }
      }
      const severance = emp.salary
      if (state.cash < severance) {
        return { ...state, notifications: [...state.notifications, `资金不足，无法支付${emp.name}的遣散费${fmtMoney(severance)}元`] }
      }
      return {
        ...state,
        cash: state.cash - severance,
        employees: state.employees.filter(e => e.id !== action.payload.employeeId),
        notifications: [...state.notifications, `${emp.name}已辞退，支付遣散费${fmtMoney(severance)}元`],
      }
    }

    case 'ASSIGN_POSITION':
      return {
        ...state,
        employees: state.employees.map(e =>
          e.id === action.payload.employeeId ? { ...e, position: action.payload.position } : e
        ),
      }

    case 'TOGGLE_DUAL_ROLE':
      return {
        ...state,
        employees: state.employees.map(e =>
          e.id === action.payload.employeeId
            ? {
                ...e,
                isDualRole: !e.isDualRole,
                salary: e.isDualRole
                  ? (e.baseSalary ?? Math.round(e.salary / 1.3))
                  : Math.round((e.baseSalary ?? e.salary) * 1.3),
              }
            : e
        ),
      }

    case 'RESEARCH_RECIPE': {
      if (state.stamina.current < 2) return state
      if (state.cash < RECIPE_RESEARCH_COST) return state

      const sauces = action.payload
      const recipeScore = scoreRecipe(sauces)
      const name = generateRecipeName(sauces)
      const newRecipe = {
        id: `recipe_${Date.now()}`,
        sauces,
        score: recipeScore.total,
        isPatented: false,
        name,
      }

      return {
        ...state,
        cash: state.cash - RECIPE_RESEARCH_COST,
        stamina: { ...state.stamina, current: state.stamina.current - 2 },
        recipes: [...state.recipes, newRecipe],
        notifications: [...state.notifications, `研发完成！配方「${name}」得分：${recipeScore.total}分`],
      }
    }

    case 'PATENT_RECIPE': {
      const recipe = state.recipes.find(r => r.id === action.payload.recipeId)
      if (!recipe || recipe.score < 8 || recipe.isPatented) return state
      return {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.payload.recipeId ? { ...r, isPatented: true } : r
        ),
        patentedRecipeCount: state.patentedRecipeCount + 1,
        brandAwareness: Math.min(100, state.brandAwareness + 5),
        notifications: [...state.notifications, `配方「${recipe.name}」已申请专利！品牌知名度+5`],
      }
    }

    case 'SET_ACTIVE_RECIPE': {
      const recipe = state.recipes.find(r => r.id === action.payload.recipeId)
      if (!recipe) return state
      return {
        ...state,
        activeRecipeId: action.payload.recipeId,
        notifications: [...state.notifications, `当前使用配方：${recipe.name}`],
      }
    }

    case 'JOIN_PLATFORM': {
      const platform = state.platforms.find(p => p.id === action.payload.platformId)
      if (!platform || platform.isJoined) return state
      if (state.cash < platform.deposit) return state
      return {
        ...state,
        cash: state.cash - platform.deposit,
        platforms: state.platforms.map(p =>
          p.id === action.payload.platformId ? { ...p, isJoined: true, weekJoined: state.absoluteWeek } : p
        ),
        notifications: [...state.notifications, `已加入${platform.name}，缴纳保证金${fmtMoney(platform.deposit)}元`],
      }
    }

    case 'LEAVE_PLATFORM': {
      const platform = state.platforms.find(p => p.id === action.payload.platformId)
      if (!platform || !platform.isJoined) return state
      return {
        ...state,
        cash: state.cash + platform.deposit,
        platforms: state.platforms.map(p =>
          p.id === action.payload.platformId ? { ...p, isJoined: false, marketingActive: false, isDelegated: false, extraMarketingCost: 0 } : p
        ),
        notifications: [...state.notifications, `已退出${platform.name}，退还保证金${fmtMoney(platform.deposit)}元`],
      }
    }

    case 'TOGGLE_PLATFORM_DELEGATION':
      return {
        ...state,
        platforms: state.platforms.map(p =>
          p.id === action.payload.platformId ? { ...p, isDelegated: !p.isDelegated } : p
        ),
      }

    case 'SET_DELIVERY_METHOD':
      return {
        ...state,
        platforms: state.platforms.map(p =>
          p.id === action.payload.platformId ? { ...p, deliveryMethod: action.payload.method } : p
        ),
      }

    case 'TOGGLE_PLATFORM_MARKETING': {
      const platform = state.platforms.find(p => p.id === action.payload.platformId)
      if (!platform) return state
      if (!platform.marketingActive) {
        if (state.cash < 20000) return state
        const boost = 0.2 + Math.random() * 0.1
        return {
          ...state,
          cash: state.cash - 20000,
          platforms: state.platforms.map(p =>
            p.id === action.payload.platformId ? { ...p, marketingActive: true, marketingBoost: boost } : p
          ),
          notifications: [...state.notifications, `用增达人已开启！花费${fmtMoney(20000)}元，基础订单量提升${Math.round(boost * 100)}%`],
        }
      }
      return {
        ...state,
        platforms: state.platforms.map(p =>
          p.id === action.payload.platformId ? { ...p, marketingActive: false, marketingBoost: 0 } : p
        ),
        notifications: [...state.notifications, '用增达人已关闭'],
      }
    }

    case 'ACTIVATE_PRIVATE_DOMAIN':
      return {
        ...state,
        privateDomains: state.privateDomains.map(pd =>
          pd.channel === action.payload.channel ? { ...pd, isActive: !pd.isActive } : pd
        ),
      }

    case 'DELEGATE_PRIVATE_DOMAIN':
      return {
        ...state,
        privateDomains: state.privateDomains.map(pd =>
          pd.channel === action.payload.channel
            ? { ...pd, isDelegated: action.payload.employeeId !== null, delegatedEmployeeId: action.payload.employeeId }
            : pd
        ),
      }

    case 'EXPAND_B2B': {
      if (state.stamina.current < 2) return state
      const activeCount = state.b2bMerchants.filter(m => m.isActive).length
      if (activeCount >= 8) {
        return { ...state, notifications: [...state.notifications, 'B端合作商家已达上限(8家)'] }
      }
      const count = randInt(2, 3)
      const unlocked = state.b2bMerchants.filter(m => !m.isActive && m.cooldownWeeksLeft <= 0 && m.unlockWeek <= state.absoluteWeek)
      const available = unlocked.sort(() => Math.random() - 0.5).slice(0, Math.min(count, unlocked.length))
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 2 },
        notifications: available.length > 0
          ? [...state.notifications, `发现${available.length}家潜在B端客户`]
          : [...state.notifications, '暂无新的B端客户'],
      }
    }

    case 'SIGN_B2B_CONTRACT': {
      return {
        ...state,
        b2bMerchants: state.b2bMerchants.map(m =>
          m.type === action.payload.merchantType
            ? { ...m, isActive: true, relationLevel: 'stranger' as const, fulfilledCount: 0, breachCount: 0 }
            : m
        ),
        notifications: [...state.notifications, `成功签约B端客户！`],
      }
    }

    case 'BUY_FURNITURE': {
      const config = FURNITURE_CONFIG_MAP.get(action.payload.furnitureType)
      if (!config) return state
      if (state.stamina.current < 1) return state
      if (state.cash < config.price) return state

      const existing = state.shop.furniture.find(f => f.type === action.payload.furnitureType)
      const updatedFurniture = existing
        ? state.shop.furniture.map(f => f.type === action.payload.furnitureType ? { ...f, count: f.count + 1 } : f)
        : [...state.shop.furniture, { type: action.payload.furnitureType, count: 1 }]

      return {
        ...state,
        cash: state.cash - config.price,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        shop: { ...state.shop, furniture: updatedFurniture },
        notifications: [...state.notifications, `购买了${config.name}`],
      }
    }

    case 'EXPAND_SHOP': {
      if (state.stamina.current < 1) return state
      if (state.shop.floor1Area >= SHOP_CONFIG.maxFloor1Area) return state
      if (state.cash < SHOP_CONFIG.expansionCost) return state
      return {
        ...state,
        cash: state.cash - SHOP_CONFIG.expansionCost,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        shop: {
          ...state.shop,
          floor1Area: state.shop.floor1Area + SHOP_CONFIG.expansionAreaIncrement,
          rent: state.shop.rent + SHOP_CONFIG.expansionRentIncrement,
          maxStaff: state.shop.maxStaff + SHOP_CONFIG.expansionStaffIncrement,
          maxCustomers: state.shop.maxCustomers + SHOP_CONFIG.expansionCustomerIncrement,
        },
        notifications: [...state.notifications, `店铺扩张至${state.shop.floor1Area + SHOP_CONFIG.expansionAreaIncrement}平方米`],
      }
    }

    case 'BUILD_FLOOR2': {
      if (state.stamina.current < 1) return state
      if (state.shop.hasFloor2) return state
      if (state.shop.floor1Area < SHOP_CONFIG.maxFloor1Area) return state
      if (state.cash < SHOP_CONFIG.floor2Cost) return state
      return {
        ...state,
        cash: state.cash - SHOP_CONFIG.floor2Cost,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        shop: {
          ...state.shop,
          hasFloor2: true,
          rent: state.shop.rent + SHOP_CONFIG.floor2RentIncrement,
          maxStaff: state.shop.maxStaff + SHOP_CONFIG.floor2StaffCapacity,
          maxCustomers: state.shop.maxCustomers + SHOP_CONFIG.floor2CustomerCapacity,
        },
        notifications: [...state.notifications, '二层修建完成！'],
      }
    }

    case 'GET_BEER_LICENSE': {
      if (state.stamina.current < 1) return state
      if (state.hasBeerLicense) return state
      return {
        ...state,
        hasBeerLicense: true,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        notifications: [...state.notifications, '已获得啤酒销售许可证！'],
      }
    }

    case 'PLAN_MARKETING': {
      if (state.stamina.current < 1) return state
      const updatedEvents = state.marketingEvents.map(event => {
        const schedule = EVENT_SCHEDULES.find(s => s.type === event.type)
        if (!schedule) return event
        const monthMatch = schedule.periodMonths ? schedule.periodMonths.includes(state.gameTime.month) : true
        const yearMatch = schedule.periodYears === null
          || state.gameTime.year % schedule.periodYears === 1
          || state.gameTime.year % schedule.periodYears === 0
        return { ...event, isActive: monthMatch && yearMatch }
      })
      const activated = updatedEvents.filter(e => e.isActive && !state.marketingEvents.find(old => old.type === e.type && old.isActive))
      const activatedNames = activated.map(e => e.name)
      const note = activatedNames.length > 0
        ? `下周营销活动已策划，激活：${activatedNames.join('、')}`
        : '下周营销活动已策划（当前无匹配赛事）'
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        marketingEvents: updatedEvents,
        notifications: [...state.notifications, note],
      }
    }

    case 'APPEAL_REVIEW': {
      const { reviewIndex } = action.payload
      if (state.stamina.current < 1) return state
      const review = state.reviews[reviewIndex]
      if (!review || !review.canAppeal || review.isAppealed) return state

      const success = review.channel !== 'offline' && Math.random() < 0.8
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        reviews: state.reviews.map((r, i) =>
          i === reviewIndex ? { ...r, isAppealed: true, isPositive: success ? true : r.isPositive } : r
        ),
        notifications: [...state.notifications, success ? '差评申诉成功！' : '差评申诉失败'],
      }
    }

    case 'APPEAL_ALL_REVIEWS': {
      if (state.stamina.current < 1) return state
      let successCount = 0
      let failCount = 0
      const updatedReviews = state.reviews.map(r => {
        if (!r.isPositive && r.canAppeal && !r.isAppealed) {
          const success = r.channel !== 'offline' && Math.random() < 0.8
          if (success) successCount++
          else failCount++
          return { ...r, isAppealed: true, isPositive: success ? true : r.isPositive }
        }
        return r
      })
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        reviews: updatedReviews,
        notifications: [...state.notifications, `一键申诉完成：${successCount}条成功，${failCount}条失败`],
      }
    }

    case 'COMMUNICATE_HQ': {
      if (state.stamina.current < 1) return state
      if (!state.isFranchisePeriod) return state
      const responded = Math.random() < 0.6
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        notifications: [...state.notifications, responded ? '总部已收到建议' : '总部未回应'],
      }
    }

    case 'TOGGLE_SKU_FRANCHISE': {
      if (state.stamina.current < 1) return state
      if (!state.isFranchisePeriod) return state
      const skuId = action.payload.skuId
      const hqResponds = Math.random() < 0.5
      if (!hqResponds) {
        return {
          ...state,
          stamina: { ...state.stamina, current: state.stamina.current - 1 },
          notifications: [...state.notifications, '总部未理睬你的SKU调整请求'],
        }
      }
      const isEnabled = state.enabledSkus.includes(skuId)
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        enabledSkus: isEnabled
          ? state.enabledSkus.filter(id => id !== skuId)
          : [...state.enabledSkus, skuId],
        notifications: [...state.notifications, isEnabled ? '总部同意下架该SKU' : '总部同意上架该SKU'],
      }
    }

    case 'TOGGLE_SKU_INDEPENDENT': {
      if (state.isFranchisePeriod) return state
      const skuId = action.payload.skuId
      const isEnabled = state.enabledSkus.includes(skuId)
      return {
        ...state,
        enabledSkus: isEnabled
          ? state.enabledSkus.filter(id => id !== skuId)
          : [...state.enabledSkus, skuId],
        notifications: [...state.notifications, isEnabled ? '已下架该SKU' : '已上架该SKU'],
      }
    }

    case 'SET_PRIVATE_DOMAIN_STRATEGY': {
      const { channel, strategy } = action.payload
      return {
        ...state,
        privateDomains: state.privateDomains.map(pd =>
          pd.channel === channel ? { ...pd, strategy } : pd
        ),
      }
    }

    case 'DISCARD_EXPIRED':
      return {
        ...state,
        inventory: state.inventory.filter((_, i) => i !== action.payload.inventoryIndex),
      }

    case 'USE_EXPIRED': {
      const item = state.inventory[action.payload.inventoryIndex]
      if (!item) return state
      return {
        ...state,
        inventory: state.inventory.map((item, i) =>
          i === action.payload.inventoryIndex ? { ...item, remainingShelfLife: 1 } : item
        ),
        notifications: [...state.notifications, `警告：使用过期${INGREDIENT_CONFIG_MAP.get(item.type)?.name ?? '原料'}有80%概率导致顾客不适`],
      }
    }

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((_, i) => i !== action.payload.index),
      }

    case 'START_GAME': {
      const initialState = createInitialState()
      const candidates = generateCandidates(4)
      const employees = candidates.map((c, i) => ({
        id: `emp_${Date.now()}_${i}`,
        name: c.name,
        skills: { ...c.skills },
        position: i === 0 ? 'kitchen' as const : i === 1 ? 'cashier' as const : 'none' as const,
        salary: c.expectedSalary,
        mood: 70,
        isDualRole: false,
        weekHired: 1,
        baseSalary: c.expectedSalary,
      }))
      return {
        ...initialState,
        gamePhase: 'playing',
        employees,
        pendingHires: [],
        shopName: state.shopName,
      }
    }

    case 'LOAD_STATE':
      return action.payload

    case 'SET_CANDIDATES':
      return { ...state, pendingHires: action.payload }

    case 'SET_AVAILABLE_B2B':
      return { ...state, b2bMerchants: action.payload }

    case 'PLATFORM_OPERATION': {
      const platform = state.platforms.find(p => p.id === action.payload.platformId)
      if (platform?.isDelegated) return state
      if (state.platformOperationStaminaUsed) return state
      if (state.stamina.current < PLATFORM_OPERATION_STAMINA_COST) return state
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - PLATFORM_OPERATION_STAMINA_COST },
        platformOperationStaminaUsed: true,
      }
    }

    case 'PRIVATE_DOMAIN_OPERATION': {
      const pd = state.privateDomains.find(pd => pd.channel === action.payload.channel)
      if (pd?.isDelegated) return state
      if (state.privateDomainOperationStaminaUsed) return state
      if (state.stamina.current < PRIVATE_DOMAIN_OPERATION_STAMINA_COST) return state
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - PRIVATE_DOMAIN_OPERATION_STAMINA_COST },
        privateDomainOperationStaminaUsed: true,
      }
    }

    case 'COMPLETE_TUTORIAL_STEP':
      return {
        ...state,
        tutorialSteps: state.tutorialSteps.map(step =>
          step.week === action.payload.week ? { ...step, isCompleted: true } : step
        ),
      }

    case 'DECLARE_INDEPENDENCE': {
      if (state.stamina.current < 1) return state
      if (!state.isFranchisePeriod) return state
      if (state.patentedRecipeCount < 1) return state
      return {
        ...state,
        isFranchisePeriod: false,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        notifications: [...state.notifications, '独立宣言！你已脱离加盟，开始使用自研配方经营'],
      }
    }

    case 'DISMISS_BANKRUPTCY_STORY':
      return {
        ...state,
        pendingBankruptcyStory: null,
      }

    case 'TALK_TO_EMPLOYEE': {
      if (state.stamina.current < 1) return state
      const emp = state.employees.find(e => e.id === action.payload.employeeId)
      if (!emp) return state
      const success = Math.random() < 0.5
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        employees: state.employees.map(e =>
          e.id === action.payload.employeeId && success
            ? { ...e, mood: Math.min(100, e.mood + 10) }
            : e
        ),
        notifications: [...state.notifications, success ? `${emp.name}谈心后心情好转` : `${emp.name}谈心效果不佳`],
      }
    }

    case 'PUSH_EMPLOYEE': {
      if (state.stamina.current < 1) return state
      const emp = state.employees.find(e => e.id === action.payload.employeeId)
      if (!emp) return state
      const skillUp = Math.random() < 0.5
      const skillKeys: (keyof Skill)[] = ['speechcraft', 'patience', 'stamina_skill', 'carefulness', 'speed']
      const randomSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)]
      return {
        ...state,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        employees: state.employees.map(e => {
          if (e.id !== action.payload.employeeId) return e
          if (skillUp) {
            const currentVal = e.skills[randomSkill]
            if (currentVal >= 10) return e
            return { ...e, skills: { ...e.skills, [randomSkill]: currentVal + 1 } }
          }
          return { ...e, mood: Math.max(0, e.mood - 10) }
        }),
        notifications: [...state.notifications, skillUp ? `${emp.name}的${SKILL_NAME_MAP[randomSkill]}提升了！` : `${emp.name}被push后心情变差了`],
      }
    }

    case 'DISMISS_TUTORIAL':
      return { ...state, tutorialDismissed: true }

    case 'DISMISS_TALENT_SUBSIDY':
      return { ...state, talentSubsidyShown: true }

    case 'REPAY_LOAN': {
      const loan = state.activeLoans[action.payload.loanIndex]
      if (!loan) return state
      if (state.cash < loan.amount) {
        return { ...state, notifications: [...state.notifications, `资金不足，无法偿还${loan.source}的借款${fmtMoney(loan.amount)}元`] }
      }
      const newLoans = [...state.activeLoans]
      newLoans.splice(action.payload.loanIndex, 1)
      return {
        ...state,
        cash: state.cash - loan.amount,
        activeLoans: newLoans,
        notifications: [...state.notifications, `已偿还${loan.source}的借款${fmtMoney(loan.amount)}元`],
      }
    }

    case 'SAVE_GAME': {
      saveGame(action.payload.slot, state)
      return { ...state, notifications: [...state.notifications, `存档成功！`] }
    }

    case 'SET_SHOP_NAME':
      return { ...state, shopName: action.payload.name }

    case 'LOAD_SAVE': {
      const loaded = loadGame(action.payload.slot)
      if (loaded) return loaded
      return state
    }

    case 'STOP_MARKETING': {
      return {
        ...state,
        marketingEvents: state.marketingEvents.map(e =>
          e.type === action.payload.eventType ? { ...e, isActive: false } : e
        ),
        notifications: [...state.notifications, '已终止营销活动'],
      }
    }

    case 'REPAIR_FURNITURE': {
      const fType = action.payload.furnitureType
      const fItem = state.shop.furniture.find(f => f.type === fType)
      if (!fItem || !(fItem.brokenCount ?? 0)) return state
      const cfg = FURNITURE_CONFIG_MAP.get(fType)
      if (!cfg) return state
      const repairCost = (fItem.brokenCount ?? 0) * cfg.repairCost
      if (state.cash < repairCost) return state
      return {
        ...state,
        cash: state.cash - repairCost,
        shop: {
          ...state.shop,
          furniture: state.shop.furniture.map(f =>
            f.type === fType
              ? { ...f, count: f.count + (f.brokenCount ?? 0), brokenCount: 0 }
              : f
          ),
        },
        notifications: [...state.notifications, `维修${cfg.name}×${fItem.brokenCount}，花费${fmtMoney(repairCost)}元`],
      }
    }

    case 'HIRE_INTERN': {
      if (state.cash < 2000 || state.stamina.current < 1) return state
      const usedNames = new Set(state.employees.map(e => e.name))
      const available = INTERN_NAMES.filter(n => !usedNames.has(n))
      if (available.length === 0) return state
      const name = available[Math.floor(Math.random() * available.length)]
      const intern: Employee = {
        id: `intern_${Date.now()}_${Math.random()}`,
        name,
        skills: {
          speechcraft: Math.floor(Math.random() * 3) + 1,
          patience: Math.floor(Math.random() * 3) + 1,
          stamina_skill: Math.floor(Math.random() * 5) + 3,
          carefulness: Math.floor(Math.random() * 3) + 1,
          speed: Math.floor(Math.random() * 5) + 3,
        },
        position: 'kitchen',
        salary: 2000,
        mood: 80,
        isDualRole: false,
        weekHired: state.absoluteWeek,
        isIntern: true,
      }
      return {
        ...state,
        cash: state.cash - 2000,
        stamina: { ...state.stamina, current: state.stamina.current - 1 },
        employees: [...state.employees, intern],
        totalInternsHired: state.totalInternsHired + 1,
        notifications: [...state.notifications, `招募实习生${name}，月薪2000元`],
      }
    }

    case 'OUTSOURCE_CHANNEL': {
      const { channel, outsourceType } = action.payload
      const forecast = state.channelOrderForecasts.find(f => f.channel === channel)
      if (!forecast) return state
      const weeksLeft = outsourceType === 'emergency' ? 1 : 12
      return {
        ...state,
        channelOrderForecasts: state.channelOrderForecasts.map(f =>
          f.channel === channel
            ? { ...f, isOutsourced: true, outsourceType, outsourceWeeksLeft: weeksLeft }
            : f
        ),
        totalOutsourceCount: state.totalOutsourceCount + 1,
        notifications: [...state.notifications, `${outsourceType === 'emergency' ? '紧急' : '长期'}外包${channel}渠道订单`],
      }
    }

    case 'TOGGLE_WATCH_PARTY': {
      const isActive = state.watchPartyActive && state.watchPartyEvent === action.payload.eventType
      return {
        ...state,
        watchPartyActive: !isActive,
        watchPartyEvent: !isActive ? action.payload.eventType : null,
        notifications: [...state.notifications, !isActive ? '开启到店观赛，活动期间到店订单+200%' : '关闭到店观赛'],
      }
    }

    case 'CYCLE_TITLE': {
      if (state.titles.length === 0) return state
      const currentIdx = state.currentTitle ? state.titles.indexOf(state.currentTitle) : -1
      const nextIdx = (currentIdx + 1) % state.titles.length
      return { ...state, currentTitle: state.titles[nextIdx] }
    }

    default:
      return state
  }
}

type GameContextValue = {
  state: GameState
  dispatch: Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState)
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
