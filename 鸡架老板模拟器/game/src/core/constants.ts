import type {
  B2BMerchant,
  B2BMerchantType,
  B2BRelationLevel,
  EventType,
  FurnitureType,
  GameState,
  IngredientType,
  Platform,
  PlatformId,
  PrivateDomain,
  PrivateDomainChannel,
  Recipe,
  SKU,
  StoryEvent,
  Title,
  TutorialStep,
} from '../types'

export const INITIAL_CASH = 150000
export const FRANCHISE_FEE = 20000
export const RECIPE_RESEARCH_COST = 10000
export const HIRE_COST = 2000
export const INTERN_SALARY = 2000
export const INTERN_HIRE_COST = 2000
export const MARKETING_INVESTMENT_PER_WEEK = 2100
export const B2B_DELIVERY_FEE_PER_MERCHANT = 100
export const CANCELLED_ORDER_THRESHOLD = 50
export const SUSPENSION_WEEKS = 2
export const EXPIRED_FOOD_SICKNESS_PROBABILITY = 0.8
export const EXPIRED_FOOD_LAWSUIT_PROBABILITY = 0.05
export const EXPIRED_FOOD_LAWSUIT_COMPENSATION = 5000
export const EXPIRED_FOOD_COMPENSATION_MULTIPLIER = 3
export const B2B_REJECTION_PROBABILITY = 0.3
export const B2B_COOLDOWN_WEEKS = 4
export const DELEGATE_REVENUE_DROP_PROBABILITY = 0.2
export const DELEGATE_REVENUE_DROP_RANGE: [number, number] = [0.1, 0.3]
export const DELEGATE_MARKETING_RISE_PROBABILITY = 0.15
export const DELEGATE_MARKETING_RISE_RANGE: [number, number] = [0.1, 0.2]
export const BARGAIN_REJECTION_PROBABILITY = 0.4
export const BARGAIN_DISCOUNT_RATE = 0.2
export const DUAL_ROLE_WAGE_BONUS = 0.3
export const DUAL_ROLE_EFFICIENCY_PENALTY = 0.15
export const DUAL_ROLE_COMPLAINT_PROBABILITY = 0.2
export const MOOD_RESIGN_THRESHOLD = 30
export const INSPECTION_MONTHS = [6, 11]
export const WHOLESALE_QUALITY_RATE = 0.9
export const WHOLESALE_INSPECTION_FAIL_PROB = 0.3
export const ORDER_VARIANCE = 0.2
export const VICTORY_CASH_THRESHOLD = 500000
export const VICTORY_BRAND_AWARENESS = 80
export const VICTORY_STORE_COUNT = 3
export const VICTORY_MONTHLY_REVENUE = 100000
export const VICTORY_PATENTED_RECIPES = 3
export const VICTORY_RECIPE_MIN_SCORE = 8
export const KITCHEN_STANDARD_HOURS = 10
export const KITCHEN_MAX_HOURS = 14
export const KITCHEN_OVERTIME_RATE = 300
export const KITCHEN_OUTPUT_PER_SPEED_PER_HOUR = 3
export const PRIVATE_DOMAIN_DELEGATE_GOOD_SPEECH = 9
export const PRIVATE_DOMAIN_DELEGATE_BAD_SPEECH = 7
export const PRIVATE_DOMAIN_DELEGATE_GOOD_BONUS_RANGE: [number, number] = [0.15, 0.25]
export const PRIVATE_DOMAIN_DELEGATE_BAD_PROBABILITY = 0.25

export const BANKRUPTCY_LOAN_AMOUNT = 100000
export const BANKRUPTCY_LOAN_REPAY_WEEKS = 48
export const MAX_BANKRUPTCIES = 3

export const CHANNEL_PRIORITY: string[] = [
  'b2b',
  'mt',
  'sg',
  'jd',
  'offline',
  'private_domain',
]

export const DIRECT_STORE_WEEK = 69

export const SELF_RESEARCHED_SAUCE_COST = 0.1

export const SELF_DELIVERY_BAD_REVIEW_PROB = 0.25

export const PLATFORM_OPERATION_STAMINA_COST = 1
export const PRIVATE_DOMAIN_OPERATION_STAMINA_COST = 1

export const MOOD_RESIGN_PROBABILITY = 0.6

export const CHANNEL_LABELS: Record<string, string> = {
  b2b: 'B端供货',
  mt: 'MT外卖',
  sg: 'SG外卖',
  jd: 'JD外卖',
  offline: '线下到店',
  private_domain: '私域运营',
}

export type IngredientConfig = {
  type: IngredientType
  name: string
  officialPrice: number | null
  otherPriceRange: [number, number] | null
  bulkDiscountThreshold: number | null
  bulkDiscountRate: number | null
  shelfLife: number
  summerShelfLife: number
  hasInspectionRisk: boolean
  requiresLicense: boolean
}

export const INGREDIENT_CONFIGS: IngredientConfig[] = [
  {
    type: 'chicken_rack',
    name: '生鸡架',
    officialPrice: 7,
    otherPriceRange: [4, 7],
    bulkDiscountThreshold: 800,
    bulkDiscountRate: 0.9,
    shelfLife: 2,
    summerShelfLife: 1,
    hasInspectionRisk: true,
    requiresLicense: false,
  },
  {
    type: 'official_sauce',
    name: '官方拌料',
    officialPrice: 2,
    otherPriceRange: null,
    bulkDiscountThreshold: 800,
    bulkDiscountRate: 0.9,
    shelfLife: 12,
    summerShelfLife: 6,
    hasInspectionRisk: false,
    requiresLicense: false,
  },
  {
    type: 'self_sauce',
    name: '自研拌料',
    officialPrice: null,
    otherPriceRange: [0.1, 0.1],
    bulkDiscountThreshold: null,
    bulkDiscountRate: null,
    shelfLife: 12,
    summerShelfLife: 6,
    hasInspectionRisk: false,
    requiresLicense: false,
  },
  {
    type: 'kelp',
    name: '海带结',
    officialPrice: 1,
    otherPriceRange: [0.4, 1],
    bulkDiscountThreshold: 500,
    bulkDiscountRate: 0.9,
    shelfLife: 2,
    summerShelfLife: 1,
    hasInspectionRisk: true,
    requiresLicense: false,
  },
  {
    type: 'peanut',
    name: '花生米',
    officialPrice: 2,
    otherPriceRange: [1, 2],
    bulkDiscountThreshold: 500,
    bulkDiscountRate: 0.9,
    shelfLife: 8,
    summerShelfLife: 4,
    hasInspectionRisk: true,
    requiresLicense: false,
  },
  {
    type: 'gongcai',
    name: '贡菜',
    officialPrice: 1,
    otherPriceRange: [0.4, 1],
    bulkDiscountThreshold: 500,
    bulkDiscountRate: 0.9,
    shelfLife: 2,
    summerShelfLife: 1,
    hasInspectionRisk: true,
    requiresLicense: false,
  },
  {
    type: 'instant_noodle',
    name: '方便面',
    officialPrice: 2,
    otherPriceRange: [1, 2],
    bulkDiscountThreshold: 500,
    bulkDiscountRate: 0.9,
    shelfLife: 8,
    summerShelfLife: 4,
    hasInspectionRisk: true,
    requiresLicense: false,
  },
  {
    type: 'cola',
    name: '可乐',
    officialPrice: null,
    otherPriceRange: [1, 3],
    bulkDiscountThreshold: 700,
    bulkDiscountRate: 0.9,
    shelfLife: 30,
    summerShelfLife: 30,
    hasInspectionRisk: false,
    requiresLicense: false,
  },
  {
    type: 'ice_water',
    name: '冰水',
    officialPrice: null,
    otherPriceRange: [0.5, 1],
    bulkDiscountThreshold: 700,
    bulkDiscountRate: 0.9,
    shelfLife: 30,
    summerShelfLife: 30,
    hasInspectionRisk: false,
    requiresLicense: false,
  },
  {
    type: 'juice',
    name: '果汁',
    officialPrice: null,
    otherPriceRange: [1, 4],
    bulkDiscountThreshold: 700,
    bulkDiscountRate: 0.9,
    shelfLife: 30,
    summerShelfLife: 30,
    hasInspectionRisk: false,
    requiresLicense: false,
  },
  {
    type: 'beer',
    name: '啤酒',
    officialPrice: null,
    otherPriceRange: [2, 5],
    bulkDiscountThreshold: 700,
    bulkDiscountRate: 0.9,
    shelfLife: 30,
    summerShelfLife: 30,
    hasInspectionRisk: false,
    requiresLicense: true,
  },
  {
    type: 'event_merch',
    name: '活动周边',
    officialPrice: null,
    otherPriceRange: [0.5, 0.5],
    bulkDiscountThreshold: null,
    bulkDiscountRate: null,
    shelfLife: 999,
    summerShelfLife: 999,
    hasInspectionRisk: false,
    requiresLicense: false,
  },
]

export const INGREDIENT_CONFIG_MAP = new Map(
  INGREDIENT_CONFIGS.map((c) => [c.type, c]),
)

export type FurnitureConfig = {
  type: FurnitureType
  name: string
  price: number
  isRequired: boolean
  area: number
  breakRate: number
  repairCost: number
  isStorefront: boolean
}

export const FURNITURE_CONFIGS: FurnitureConfig[] = [
  { type: 'cashier', name: '收银台', price: 1500, isRequired: true, area: 0, breakRate: 0, repairCost: 0, isStorefront: true },
  { type: 'table_chair', name: '桌椅(每套)', price: 200, isRequired: true, area: 0, breakRate: 0, repairCost: 0, isStorefront: true },
  { type: 'fan_store', name: '风扇(店面)', price: 300, isRequired: false, area: 10, breakRate: 0.2, repairCost: 200, isStorefront: true },
  { type: 'ac_store', name: '空调(店面)', price: 5000, isRequired: false, area: 60, breakRate: 0.05, repairCost: 300, isStorefront: true },
  { type: 'packaging_table', name: '外卖打包台', price: 1000, isRequired: true, area: 0, breakRate: 0, repairCost: 0, isStorefront: true },
  { type: 'tv', name: '小电视', price: 3000, isRequired: false, area: 0, breakRate: 0, repairCost: 0, isStorefront: true },
  { type: 'projector', name: '投影仪', price: 8000, isRequired: false, area: 0, breakRate: 0, repairCost: 0, isStorefront: true },
  { type: 'ad_screen', name: '临街广告屏', price: 2000, isRequired: false, area: 0, breakRate: 0, repairCost: 0, isStorefront: true },
  { type: 'prep_table', name: '处理鸡架操作台', price: 1000, isRequired: true, area: 0, breakRate: 0, repairCost: 0, isStorefront: false },
  { type: 'mix_table', name: '拌鸡架操作台', price: 2000, isRequired: true, area: 0, breakRate: 0, repairCost: 0, isStorefront: false },
  { type: 'fridge', name: '冰箱', price: 5000, isRequired: true, area: 0, breakRate: 0, repairCost: 0, isStorefront: false },
  { type: 'fan_kitchen', name: '风扇(后厨)', price: 300, isRequired: false, area: 10, breakRate: 0.2, repairCost: 200, isStorefront: false },
  { type: 'ac_kitchen', name: '空调(后厨)', price: 5000, isRequired: false, area: 60, breakRate: 0.05, repairCost: 300, isStorefront: false },
]

export const FURNITURE_CONFIG_MAP = new Map(
  FURNITURE_CONFIGS.map((c) => [c.type, c]),
)

export const REQUIRED_FURNITURE_TYPES = FURNITURE_CONFIGS
  .filter((c) => c.isRequired)
  .map((c) => c.type)

export const REQUIRED_FURNITURE_COST = FURNITURE_CONFIGS
  .filter((c) => c.isRequired)
  .reduce((sum, c) => sum + c.price, 0)

export const SKU_CONFIGS: SKU[] = [
  {
    id: 'main_chicken_rack',
    name: '拌鸡架',
    type: 'main',
    price: 12,
    ingredients: { chicken_rack: 1, official_sauce: 1 },
  },
  {
    id: 'side_kelp',
    name: '海带结',
    type: 'side',
    price: 2,
    ingredients: { kelp: 1 },
  },
  {
    id: 'side_gongcai',
    name: '贡菜',
    type: 'side',
    price: 2,
    ingredients: { gongcai: 1 },
  },
  {
    id: 'side_peanut',
    name: '花生米',
    type: 'side',
    price: 3,
    ingredients: { peanut: 1 },
  },
  {
    id: 'side_instant_noodle',
    name: '方便面',
    type: 'side',
    price: 3,
    ingredients: { instant_noodle: 1 },
  },
  {
    id: 'drink_cola',
    name: '可乐',
    type: 'drink',
    price: 3,
    ingredients: { cola: 1 },
  },
  {
    id: 'drink_ice_water',
    name: '冰水',
    type: 'drink',
    price: 2,
    ingredients: { ice_water: 1 },
  },
  {
    id: 'drink_juice',
    name: '果汁',
    type: 'drink',
    price: 5,
    ingredients: { juice: 1 },
  },
  {
    id: 'drink_beer',
    name: '啤酒',
    type: 'drink',
    price: 7,
    ingredients: { beer: 1 },
    requiresLicense: true,
  },
  {
    id: 'combo_a',
    name: '套餐A',
    type: 'combo',
    price: 13,
    ingredients: { chicken_rack: 1, official_sauce: 1, kelp: 1 },
  },
  {
    id: 'combo_b',
    name: '套餐B',
    type: 'combo',
    price: 14,
    ingredients: { chicken_rack: 1, official_sauce: 1, gongcai: 1 },
  },
  {
    id: 'combo_c',
    name: '套餐C',
    type: 'combo',
    price: 14,
    ingredients: { chicken_rack: 1, official_sauce: 1, cola: 1 },
  },
  {
    id: 'combo_d',
    name: '套餐D',
    type: 'combo',
    price: 17,
    ingredients: { chicken_rack: 1, official_sauce: 1, beer: 1 },
    requiresLicense: true,
  },
  {
    id: 'event_combo_a',
    name: '赛事套餐A',
    type: 'event_combo',
    price: 17,
    ingredients: { chicken_rack: 1, official_sauce: 1, beer: 1, event_merch: 1 },
    requiresLicense: true,
    isEventOnly: true,
  },
  {
    id: 'event_combo_b',
    name: '赛事套餐B',
    type: 'event_combo',
    price: 16,
    ingredients: { chicken_rack: 1, official_sauce: 1, beer: 1, event_merch: 1 },
    requiresLicense: true,
    isEventOnly: true,
  },
  {
    id: 'event_combo_c',
    name: '活动套餐C',
    type: 'event_combo',
    price: 15,
    ingredients: { chicken_rack: 1, official_sauce: 1, cola: 1, event_merch: 1 },
    isEventOnly: true,
  },
  {
    id: 'event_combo_d',
    name: '活动套餐D',
    type: 'event_combo',
    price: 13,
    ingredients: { chicken_rack: 1, official_sauce: 1, cola: 1, event_merch: 1 },
    isEventOnly: true,
  },
]

export const SKU_CONFIG_MAP = new Map(SKU_CONFIGS.map((s) => [s.id, s]))

export const PLATFORM_CONFIGS: Platform[] = [
  {
    id: 'jd',
    name: 'JD外卖',
    deposit: 3000,
    isJoined: false,
    rating: 5,
    cancelledOrders: 0,
    isSuspended: false,
    suspensionWeeksLeft: 0,
    deliveryMethod: 'platform_rider',
    marketingActive: false,
    isDelegated: false,
    extraMarketingCost: 0,
    marketingBoost: 0,
  },
  {
    id: 'mt',
    name: 'MT外卖',
    deposit: 2000,
    isJoined: false,
    rating: 5,
    cancelledOrders: 0,
    isSuspended: false,
    suspensionWeeksLeft: 0,
    deliveryMethod: 'platform_rider',
    marketingActive: false,
    isDelegated: false,
    extraMarketingCost: 0,
    marketingBoost: 0,
  },
  {
    id: 'sg',
    name: 'SG外卖',
    deposit: 2500,
    isJoined: false,
    rating: 5,
    cancelledOrders: 0,
    isSuspended: false,
    suspensionWeeksLeft: 0,
    deliveryMethod: 'platform_rider',
    marketingActive: false,
    isDelegated: false,
    extraMarketingCost: 0,
    marketingBoost: 0,
  },
]

export const PLATFORM_ORDER_RANKING: PlatformId[] = ['sg', 'mt', 'jd']

export type PlatformActivityConfig = {
  platformId: PlatformId
  name: string
  schedulePattern: 'weekly' | 'monthly_first_week' | 'monthly_third_week'
  effect: string
}

export const PLATFORM_ACTIVITY_CONFIGS: PlatformActivityConfig[] = [
  { platformId: 'jd', name: 'Plus会员日', schedulePattern: 'monthly_third_week', effect: '会员用户下单增加，满减优惠' },
  { platformId: 'mt', name: '天天特价', schedulePattern: 'weekly', effect: '每日不同SKU特价，引流效果稳定' },
  { platformId: 'sg', name: '满减活动', schedulePattern: 'monthly_first_week', effect: '满额减优惠，单量最高' },
]

export const B2B_MERCHANT_CONFIGS: B2BMerchant[] = [
  {
    type: 'night_stall',
    name: '夜宵摊',
    unlockWeek: 2,
    minWeeklyOrders: 40,
    maxWeeklyOrders: 50,
    unitPrice: 9,
    deliveryHour: 20,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'high',
  },
  {
    type: 'chess_room',
    name: '棋牌室',
    unlockWeek: 3,
    minWeeklyOrders: 35,
    maxWeeklyOrders: 45,
    unitPrice: 10,
    deliveryHour: 17,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'high',
  },
  {
    type: 'foot_massage',
    name: '足浴店',
    unlockWeek: 4,
    minWeeklyOrders: 30,
    maxWeeklyOrders: 40,
    unitPrice: 10,
    deliveryHour: 17,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'medium',
  },
  {
    type: 'internet_cafe',
    name: '网吧',
    unlockWeek: 5,
    minWeeklyOrders: 40,
    maxWeeklyOrders: 50,
    unitPrice: 10,
    deliveryHour: 18,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'high',
  },
  {
    type: 'board_game',
    name: '桌游吧',
    unlockWeek: 6,
    minWeeklyOrders: 30,
    maxWeeklyOrders: 35,
    unitPrice: 11,
    deliveryHour: 18,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'low',
  },
  {
    type: 'convenience_store',
    name: '便利店',
    unlockWeek: 8,
    minWeeklyOrders: 30,
    maxWeeklyOrders: 40,
    unitPrice: 9,
    deliveryHour: 10,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'medium',
  },
  {
    type: 'ktv',
    name: 'KTV',
    unlockWeek: 10,
    minWeeklyOrders: 30,
    maxWeeklyOrders: 40,
    unitPrice: 12,
    deliveryHour: 17,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'medium',
  },
  {
    type: 'gym',
    name: '健身房',
    unlockWeek: 12,
    minWeeklyOrders: 30,
    maxWeeklyOrders: 35,
    unitPrice: 13,
    deliveryHour: 12,
    isActive: false,
    relationLevel: 'stranger',
    fulfilledCount: 0,
    breachCount: 0,
    cooldownWeeksLeft: 0,
    currentWeekOrders: 0,
    grade: 'low',
  },
]

export const B2B_MERCHANT_CONFIG_MAP = new Map(
  B2B_MERCHANT_CONFIGS.map((m) => [m.type, m]),
)

export type B2BRelationConfig = {
  level: B2BRelationLevel
  priceModifier: number
  fulfilledThreshold: number
}

export const B2B_RELATION_CONFIGS: B2BRelationConfig[] = [
  { level: 'stranger', priceModifier: -0.2, fulfilledThreshold: 0 },
  { level: 'normal', priceModifier: 0, fulfilledThreshold: 0 },
  { level: 'friendly', priceModifier: 0.1, fulfilledThreshold: 3 },
  { level: 'intimate', priceModifier: 0.25, fulfilledThreshold: 8 },
  { level: 'strategic', priceModifier: 0.3, fulfilledThreshold: 15 },
]

export const B2B_BREACH_PENALTIES = [
  { breachCount: 1, deductionRate: 0.5, relationDrop: 1, terminate: false, fine: 0 },
  { breachCount: 2, deductionRate: 1.0, relationDrop: 2, terminate: false, fine: 0 },
  { breachCount: 3, deductionRate: 0, relationDrop: 0, terminate: true, fine: 2000 },
]

export const STAMINA_COST_MAP: Record<string, number> = {
  hire_employee: 1,
  procurement: 1,
  research_recipe: 2,
  platform_operation: 1,
  private_domain_operation: 1,
  expand_b2b: 2,
  buy_furniture: 1,
  get_beer_license: 1,
  plan_marketing: 1,
  communicate_hq: 1,
  appeal_review: 1,
}

export const TITLE_THRESHOLDS: Title[] = [
  { name: '小有名气', cashThreshold: 100000 },
  { name: '口口相传', cashThreshold: 200000 },
  { name: '当地网红', cashThreshold: 400000 },
  { name: '小众点评必吃榜', cashThreshold: 600000 },
]

export const CLASSIC_RECIPES: Recipe[] = [
  {
    id: 'classic_spicy',
    name: '经典麻辣',
    sauces: { soy_sauce: 2, chili_oil: 2, vinegar: 0, sugar: 0, garlic: 2, sesame: 0, cumin: 0 },
    score: 0,
    isPatented: false,
  },
  {
    id: 'garlic_mild_spicy',
    name: '蒜香微辣',
    sauces: { soy_sauce: 2, chili_oil: 1, vinegar: 0, sugar: 0, garlic: 3, sesame: 0, cumin: 0 },
    score: 0,
    isPatented: false,
  },
  {
    id: 'sweet_sour_appetizer',
    name: '酸甜开胃',
    sauces: { soy_sauce: 2, chili_oil: 0, vinegar: 2, sugar: 2, garlic: 0, sesame: 0, cumin: 0 },
    score: 0,
    isPatented: false,
  },
  {
    id: 'bbq_flavor',
    name: '烧烤风味',
    sauces: { soy_sauce: 2, chili_oil: 0, vinegar: 0, sugar: 0, garlic: 0, sesame: 2, cumin: 3 },
    score: 0,
    isPatented: false,
  },
  {
    id: 'legendary_delicious',
    name: '绝世美味',
    sauces: { soy_sauce: 2, chili_oil: 2, vinegar: 0, sugar: 0, garlic: 2, sesame: 1, cumin: 0 },
    score: 0,
    isPatented: false,
  },
]

export const CLASSIC_RECIPE_SCORE_RANGES: Record<string, [number, number]> = {
  classic_spicy: [7, 8],
  garlic_mild_spicy: [6, 7],
  sweet_sour_appetizer: [6, 7],
  bbq_flavor: [7, 8],
  legendary_delicious: [9, 10],
}

export const RECIPE_SCORE_WEIGHTS = {
  flavorBalance: 0.3,
  harmony: 0.25,
  classicBonus: 0.25,
  innovation: 0.1,
  randomBonus: 0.1,
}

export type EventScheduleConfig = {
  type: EventType
  name: string
  periodMonths: number[] | null
  periodYears: number | null
  specificWeek: number | null
  frequencyPerWeek: number
  effect: 'massive' | 'stable' | 'peak'
}

export const EVENT_SCHEDULES: EventScheduleConfig[] = [
  { type: 'world_cup', name: '世界杯', periodMonths: [6, 7], periodYears: 4, specificWeek: null, frequencyPerWeek: 2, effect: 'massive' },
  { type: 'euro_cup', name: '欧洲杯', periodMonths: [6, 7], periodYears: 4, specificWeek: null, frequencyPerWeek: 2, effect: 'massive' },
  { type: 'champions_league', name: '欧冠决赛', periodMonths: [5], periodYears: 1, specificWeek: 3, frequencyPerWeek: 1, effect: 'peak' },
  { type: 'lol_regular', name: 'LOL常规赛', periodMonths: [3, 4, 5, 6, 7, 8, 9], periodYears: 1, specificWeek: null, frequencyPerWeek: 1, effect: 'stable' },
  { type: 'lol_worlds', name: 'LOL S赛', periodMonths: [11], periodYears: 1, specificWeek: null, frequencyPerWeek: 3, effect: 'massive' },
  { type: 'king_of_glory', name: '王者荣耀', periodMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9], periodYears: 1, specificWeek: null, frequencyPerWeek: 1, effect: 'stable' },
  { type: 'village_super', name: '村超', periodMonths: [4, 5, 6, 7, 8, 9, 10, 11], periodYears: 1, specificWeek: null, frequencyPerWeek: 1, effect: 'stable' },
]

export const SHOP_CONFIG = {
  initialArea: 40,
  initialRent: 6000,
  initialMaxStaff: 6,
  initialMaxCustomers: 6,
  expansionAreaIncrement: 20,
  expansionCost: 5000,
  expansionRentIncrement: 2500,
  expansionStaffIncrement: 3,
  expansionCustomerIncrement: 3,
  maxFloor1Area: 100,
  floor2Cost: 25000,
  floor2RentIncrement: 12500,
  floor2StaffCapacity: 15,
  floor2CustomerCapacity: 15,
  utilitiesCostPerChickenRack: 2,
}

export const EMPLOYEE_NAMES = {
  wulin: ['佟湘玉', '白展堂', '郭芙蓉', '吕秀才', '李大嘴', '祝无双', '莫小贝', '邢捕头', '燕小六'],
  zhenhuan: ['甄嬛', '沈眉庄', '安陵容', '华妃', '皇后', '端妃', '敬妃', '齐妃', '曹贵人', '苏培盛', '流朱', '浣碧'],
  sanguo: ['刘备', '关羽', '张飞', '赵云', '诸葛亮', '曹操', '孙权', '周瑜', '吕布', '貂蝉', '典韦', '许褚'],
}

export const INTERN_NAMES = ['小明', '小红', '小华', '小李', '小张', '小王', '小赵', '小陈', '小刘', '小杨', '小周', '小吴', '小孙', '小朱', '小郑']

export const SALARY_RANGE: [number, number] = [3500, 4500]

export const SKILL_RANGE: [number, number] = [1, 10]

export const CANDIDATE_COUNT_RANGE: [number, number] = [3, 5]

export const REVEALED_SKILL_COUNT = 2

export const STORY_EVENTS: StoryEvent[] = [
  {
    id: 'game_start',
    triggerWeek: 1,
    title: '游戏开始',
    description: '离职，开鸡架店，支付加盟费',
    type: 'main',
  },
  {
    id: 'first_inspection',
    triggerWeek: 0,
    title: '第一次飞行检查',
    description: '总部随机抽查',
    type: 'main',
  },
  {
    id: 'second_inspection',
    triggerWeek: 0,
    title: '第二次飞行检查',
    description: '总部随机抽查',
    type: 'main',
  },
  {
    id: 'direct_store_opening',
    triggerWeek: 69,
    title: '直营店开业',
    description: '总部开直营店抢客',
    type: 'main',
  },
  {
    id: 'independence',
    triggerWeek: 0,
    title: '独立宣言',
    description: '脱离品牌，启用自研配方',
    type: 'main',
  },
]

export const RANDOM_POSITIVE_EVENTS: Omit<StoryEvent, 'triggerWeek'>[] = [
  { id: 'food_blogger', title: '美食博主探店', description: '一位美食博主来店探店并发布好评', type: 'random_positive' },
  { id: 'regular_bring_new', title: '老客带新客', description: '老顾客带来了一批新顾客', type: 'random_positive' },
  { id: 'nearby_event', title: '周边活动引流', description: '附近举办活动带来额外客流', type: 'random_positive' },
]

export const RANDOM_NEGATIVE_EVENTS: Omit<StoryEvent, 'triggerWeek'>[] = [
  { id: 'competitor_price_cut', title: '竞争对手降价', description: '附近竞争对手推出降价促销', type: 'random_negative' },
  { id: 'supplier_price_hike', title: '供应商涨价', description: '原料供应商临时涨价', type: 'random_negative' },
  { id: 'equipment_failure', title: '设备故障', description: '店内设备突然故障需要维修', type: 'random_negative' },
  { id: 'bad_review_attack', title: '差评攻击', description: '收到恶意差评', type: 'random_negative' },
]

export const TUTORIAL_STEPS: TutorialStep[] = [
  { week: 1, system: '基础采购、制作', task: '完成首次采购，制作第一份鸡架', isCompleted: false },
  { week: 2, system: '人员管理', task: '招聘第一位店员，分配岗位', isCompleted: false },
  { week: 3, system: '外卖平台', task: '查看平台数据，参与一次活动', isCompleted: false },
  { week: 4, system: '私域运营、配方研发', task: '发布一条朋友圈，尝试研发配方', isCompleted: false },
]

export const INITIAL_PRIVATE_DOMAINS: PrivateDomain[] = [
  { channel: 'wechat_group', followerCount: 50, isActive: false, isDelegated: false, delegatedEmployeeId: null, strategy: 'new_product' },
  { channel: 'moments', followerCount: 30, isActive: false, isDelegated: false, delegatedEmployeeId: null, strategy: 'new_product' },
  { channel: 'xiaohongshu', followerCount: 20, isActive: false, isDelegated: false, delegatedEmployeeId: null, strategy: 'new_product' },
]

export const PRIVATE_DOMAIN_CHANNEL_NAMES: Record<PrivateDomainChannel, string> = {
  wechat_group: '微信群',
  moments: '朋友圈',
  xiaohongshu: '小红书',
}

export const B2B_MERCHANT_TYPE_NAMES: Record<B2BMerchantType, string> = {
  night_stall: '夜宵摊',
  chess_room: '棋牌室',
  foot_massage: '足浴店',
  internet_cafe: '网吧',
  board_game: '桌游吧',
  convenience_store: '便利店',
  ktv: 'KTV',
  gym: '健身房',
}

export const STORE_EXPANSION_COSTS = [50000, 120000]

export const SUMMER_MONTHS = [6, 7, 8]

export function isSummer(month: number): boolean {
  return SUMMER_MONTHS.includes(month)
}

export function getShelfLife(ingredientType: IngredientType, month: number): number {
  const config = INGREDIENT_CONFIG_MAP.get(ingredientType)
  if (!config) return 0
  return isSummer(month) ? config.summerShelfLife : config.shelfLife
}

export function createInitialState(): GameState {
  return {
    gameTime: { year: 1, month: 1, week: 1 },
    absoluteWeek: 1,
    cash: INITIAL_CASH - FRANCHISE_FEE - REQUIRED_FURNITURE_COST,
    totalCashEarned: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    stamina: { current: 10, max: 10 },
    shop: {
      floor1Area: SHOP_CONFIG.initialArea,
      hasFloor2: false,
      rent: SHOP_CONFIG.initialRent,
      maxStaff: SHOP_CONFIG.initialMaxStaff,
      maxCustomers: SHOP_CONFIG.initialMaxCustomers,
      furniture: REQUIRED_FURNITURE_TYPES.map((type) => ({ type, count: 1 })),
      utilitiesCost: 0,
    },
    inventory: [],
    employees: [],
    recipes: [],
    activeRecipeId: null,
    platforms: PLATFORM_CONFIGS.map((p) => ({ ...p })),
    privateDomains: INITIAL_PRIVATE_DOMAINS.map((p) => ({ ...p })),
    b2bMerchants: B2B_MERCHANT_CONFIGS.map((m) => ({ ...m })),
    marketingEvents: EVENT_SCHEDULES.map((e) => ({
      type: e.type,
      name: e.name,
      isActive: false,
    })),
    reviews: [],
    cancelledOrdersByChannel: {},
    titles: [],
    currentTitle: null,
    storyEvents: STORY_EVENTS.map((e) => ({ ...e })),
    tutorialSteps: TUTORIAL_STEPS.map((s) => ({ ...s })),
    isFranchisePeriod: true,
    leftFranchise: false,
    brandAwareness: 0,
    hasBeerLicense: false,
    weeklyRevenue: 0,
    weeklyExpenses: 0,
    weeklyRevenueDetail: [],
    weeklyExpensesDetail: [],
    monthlyExpensesDetail: [],
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    storeCount: 1,
    patentedRecipeCount: 0,
    lastWeekSales: [],
    pendingProcurement: [],
    pendingHires: [],
    gamePhase: 'story',
    weekPhase: 'review',
    notifications: [],
    channelOrderForecasts: [],
    fulfilledOrders: new Map(),
    lastMonthChickenRackSales: 0,
    platformOperationStaminaUsed: false,
    privateDomainOperationStaminaUsed: false,
    consecutiveLossMonths: 0,
    weeklyPriceAdjustments: {},
    weeklyProcurementCost: 0,
    bankruptcyCount: 0,
    activeLoans: [],
    pendingBankruptcyStory: null,
    tutorialDismissed: false,
    shopName: '',
    lastMonthOrders: 0,
    lastMonthOnlineOrders: 0,
    lastMonthOfflineOrders: 0,
    lastMonthBadReviews: 0,
    lastMonthMarketingActive: false,
    dianpingScore: null,
    dianpingRank: null,
    dianpingBonus: null,
    dianpingRanking: null,
    talentSubsidyShown: false,
    enabledSkus: SKU_CONFIGS.map(s => s.id),
    lastWeekEventMerchSold: 0,
    totalInternsHired: 0,
    totalOutsourceCount: 0,
    watchPartyActive: false,
    watchPartyEvent: null,
    acquiredBrand: false,
    acquiredBrandWeek: null,
    pendingAcquireStory: null,
    pendingDirectStoreStory: null,
    brandGoodwill: 0,
  }
}
