export type GameTime = {
  year: number
  month: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  week: 1 | 2 | 3 | 4
}

export function getWeekNumber(gameTime: GameTime): number {
  return (gameTime.year - 1) * 48 + (gameTime.month - 1) * 4 + gameTime.week
}

export type Stamina = {
  current: number
  max: 10
}

export enum StaminaCost {
  HireEmployee = 1,
  Procurement = 1,
  ResearchRecipe = 2,
  PlatformOperation = 1,
  PrivateDomainOperation = 1,
  ExpandB2B = 2,
  BuyFurniture = 1,
  GetBeerLicense = 1,
  PlanMarketing = 1,
  CommunicateHQ = 1,
  AppealReview = 1,
}

export type FurnitureType =
  | 'cashier'
  | 'table_chair'
  | 'fan_store'
  | 'ac_store'
  | 'packaging_table'
  | 'tv'
  | 'projector'
  | 'ad_screen'
  | 'prep_table'
  | 'mix_table'
  | 'fridge'
  | 'fan_kitchen'
  | 'ac_kitchen'

export type Furniture = {
  type: FurnitureType
  count: number
  brokenCount?: number
}

export type ShopExpansion = {
  floor1Area: number
  hasFloor2: boolean
}

export type Shop = ShopExpansion & {
  rent: number
  maxStaff: number
  maxCustomers: number
  furniture: Furniture[]
  utilitiesCost: number
}

export type IngredientType =
  | 'chicken_rack'
  | 'official_sauce'
  | 'self_sauce'
  | 'kelp'
  | 'peanut'
  | 'gongcai'
  | 'instant_noodle'
  | 'cola'
  | 'ice_water'
  | 'juice'
  | 'beer'
  | 'event_merch'

export type ProcurementChannel = 'official' | 'wholesale'

export type InventoryItem = {
  type: IngredientType
  quantity: number
  remainingShelfLife: number
  channel: ProcurementChannel
}

export type ProcurementOrder = {
  type: IngredientType
  quantity: number
  channel: ProcurementChannel
}

export type Skill = {
  speechcraft: number
  patience: number
  stamina_skill: number
  carefulness: number
  speed: number
}

export type Position = 'cashier' | 'waiter' | 'kitchen' | 'none'

export type Employee = {
  id: string
  name: string
  skills: Skill
  position: Position
  salary: number
  baseSalary?: number
  mood: number
  isDualRole: boolean
  weekHired: number
}

export type Candidate = {
  id: string
  name: string
  revealedSkills: Partial<Skill>
  hiddenSkills: (keyof Skill)[]
  expectedSalary: number
  skills: Skill
}

export type SauceType =
  | 'soy_sauce'
  | 'chili_oil'
  | 'vinegar'
  | 'sugar'
  | 'garlic'
  | 'sesame'
  | 'cumin'

export type SauceLevel = 0 | 1 | 2 | 3

export type Recipe = {
  id: string
  sauces: Record<SauceType, SauceLevel>
  score: number
  isPatented: boolean
  name: string
}

export type RecipeScore = {
  flavorBalance: number
  harmony: number
  classicBonus: number
  innovation: number
  randomBonus: number
  total: number
}

export type SKUType = 'main' | 'side' | 'drink' | 'combo' | 'event_combo'

export type SKU = {
  id: string
  name: string
  type: SKUType
  price: number
  ingredients: Partial<Record<IngredientType, number>>
  requiresLicense?: boolean
  isEventOnly?: boolean
}

export type PlatformId = 'jd' | 'mt' | 'sg'

export type Platform = {
  id: PlatformId
  name: string
  deposit: number
  isJoined: boolean
  rating: number
  cancelledOrders: number
  isSuspended: boolean
  suspensionWeeksLeft: number
  deliveryMethod: 'platform_rider' | 'self_delivery'
  marketingActive: boolean
  isDelegated: boolean
  extraMarketingCost: number
  weekJoined?: number
}

export type PlatformActivity = {
  platformId: PlatformId
  name: string
  scheduleWeek: number
  effect: string
}

export type PrivateDomainChannel = 'wechat_group' | 'moments' | 'xiaohongshu'

export type PrivateDomainStrategy = 'new_product' | 'discount' | 'membership' | 'feedback'

export type PrivateDomain = {
  channel: PrivateDomainChannel
  followerCount: number
  isActive: boolean
  isDelegated: boolean
  delegatedEmployeeId: string | null
  strategy: PrivateDomainStrategy
}

export type B2BMerchantType =
  | 'night_stall'
  | 'chess_room'
  | 'foot_massage'
  | 'internet_cafe'
  | 'board_game'
  | 'convenience_store'
  | 'ktv'
  | 'gym'

export type B2BRelationLevel = 'stranger' | 'normal' | 'friendly' | 'intimate' | 'strategic'

export type B2BMerchant = {
  type: B2BMerchantType
  name: string
  unlockWeek: number
  minWeeklyOrders: number
  maxWeeklyOrders: number
  unitPrice: number
  deliveryHour: number
  isActive: boolean
  relationLevel: B2BRelationLevel
  fulfilledCount: number
  breachCount: number
  cooldownWeeksLeft: number
  currentWeekOrders: number
  grade: 'high' | 'medium' | 'low'
}

export type B2BOrder = {
  merchantType: B2BMerchantType
  chickenRackCount: number
  sides: { type: IngredientType; count: number }[]
  drinks: { type: IngredientType; count: number }[]
}

export type EventType =
  | 'world_cup'
  | 'euro_cup'
  | 'champions_league'
  | 'lol_regular'
  | 'lol_worlds'
  | 'king_of_glory'
  | 'village_super'

export type MarketingEvent = {
  type: EventType
  name: string
  isActive: boolean
}

export type ReviewTag = 'delivery_speed' | 'ingredient_freshness' | 'taste'

export type Review = {
  tags: Record<ReviewTag, 'good' | 'bad'>
  isPositive: boolean
  channel: string
  canAppeal: boolean
  isAppealed: boolean
}

export type ExpiredFoodIncident = {
  occurred: boolean
  compensation: number
  lawsuitTriggered: boolean
}

export type KitchenOutput = {
  totalCapacity: number
  usedCapacity: number
  overtimeCost: number
}

export type Title = {
  name: string
  cashThreshold: number
}

export type StoryEvent = {
  id: string
  triggerWeek: number
  title: string
  description: string
  type: 'main' | 'random_positive' | 'random_negative'
  choices?: { text: string; effect: string }[]
}

export type TutorialStep = {
  week: number
  system: string
  task: string
  isCompleted: boolean
}

export type WeekPhase =
  | 'review'
  | 'procurement'
  | 'personnel'
  | 'marketing'
  | 'research'
  | 'furniture'
  | 'advance'
  | 'production'

export type GamePhase = 'story' | 'playing' | 'game_over' | 'victory'

export type ChannelSales = {
  channel: string
  orders: number
  revenue: number
  predictedOrders?: number
  actualOrders?: number
  fulfilledOrders?: number
}

/** 本周各渠道的订单预测 */
export type SKUDetail = {
  name: string
  description: string
  price: number
  basePrice?: number
  count: number
  ingredients: { name: string; count: number }[]
}

export type ChannelOrderForecast = {
  channel: string
  channelLabel: string
  orders: number
  /** 各SKU的预估数量 */
  skuBreakdown: Partial<Record<IngredientType, number>>
  /** 各SKU产品的名称和数量 */
  skuProducts: { name: string; count: number }[]
  /** 各SKU的详细信息（名称、描述、价格、数量、原料需求） */
  skuDetails: SKUDetail[]
  /** 用户是否选择放弃该渠道 */
  isCancelled: boolean
}

export type LoanInfo = {
  source: string
  amount: number
  dueWeek: number
}

export type RevenueExpenseDetail = {
  item: string
  amount: number
}

export type GameState = {
  gameTime: GameTime
  absoluteWeek: number
  cash: number
  totalCashEarned: number
  totalRevenue: number
  totalExpenses: number
  stamina: Stamina
  shop: Shop
  inventory: InventoryItem[]
  employees: Employee[]
  recipes: Recipe[]
  activeRecipeId: string | null
  platforms: Platform[]
  privateDomains: PrivateDomain[]
  b2bMerchants: B2BMerchant[]
  marketingEvents: MarketingEvent[]
  reviews: Review[]
  cancelledOrdersByChannel: Record<string, number>
  titles: string[]
  currentTitle: string | null
  storyEvents: StoryEvent[]
  tutorialSteps: TutorialStep[]
  isFranchisePeriod: boolean
  brandAwareness: number
  hasBeerLicense: boolean
  weeklyRevenue: number
  weeklyExpenses: number
  weeklyRevenueDetail: RevenueExpenseDetail[]
  weeklyExpensesDetail: RevenueExpenseDetail[]
  monthlyExpensesDetail: RevenueExpenseDetail[]
  monthlyRevenue: number
  monthlyExpenses: number
  storeCount: number
  patentedRecipeCount: number
  lastWeekSales: ChannelSales[]
  pendingProcurement: ProcurementOrder[]
  pendingHires: Candidate[]
  gamePhase: GamePhase
  weekPhase: WeekPhase
  notifications: string[]
  channelOrderForecasts: ChannelOrderForecast[]
  fulfilledOrders: Map<string, number>
  lastMonthChickenRackSales: number
  platformOperationStaminaUsed: boolean
  privateDomainOperationStaminaUsed: boolean
  consecutiveLossMonths: number
  weeklyPriceAdjustments: Record<string, number>
  weeklyProcurementCost: number
  bankruptcyCount: number
  activeLoans: LoanInfo[]
  pendingBankruptcyStory: string | null
  tutorialDismissed: boolean
  shopName: string
  lastMonthOrders: number
  lastMonthOnlineOrders: number
  lastMonthOfflineOrders: number
  lastMonthBadReviews: number
  lastMonthMarketingActive: boolean
  dianpingScore: number | null
  dianpingRank: number | null
  dianpingBonus: string | null
  dianpingRanking: { name: string; score: number; bonus: string; detail: { onlineOrders: number; onlineBaseScore: number; onlineScore: number; offlineOrders: number; offlineBaseScore: number; offlineScore: number; badReviews: number; badReviewBaseScore: number; badReviewScore: number } | null }[] | null
  talentSubsidyShown: boolean
  enabledSkus: string[]
  lastWeekEventMerchSold: number
}
