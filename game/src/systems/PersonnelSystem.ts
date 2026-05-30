import type { Candidate, Employee, Shop, Skill } from '../types'
import {
  EMPLOYEE_NAMES,
  SALARY_RANGE,
  SKILL_RANGE,
  REVEALED_SKILL_COUNT,
  BARGAIN_DISCOUNT_RATE,
  MOOD_RESIGN_THRESHOLD,
  MOOD_RESIGN_PROBABILITY,
  SUMMER_MONTHS,
} from '../core/constants'

const ALL_NAMES = [
  ...EMPLOYEE_NAMES.wulin,
  ...EMPLOYEE_NAMES.zhenhuan,
  ...EMPLOYEE_NAMES.sanguo,
]

const SKILL_KEYS: (keyof Skill)[] = [
  'speechcraft', 'patience', 'stamina_skill', 'carefulness', 'speed',
]

const FAN_AREA_COVERAGE = 10
const AC_AREA_COVERAGE = 60
const KITCHEN_AREA = 20

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateSkills(): Skill {
  return {
    speechcraft: randInt(SKILL_RANGE[0], SKILL_RANGE[1]),
    patience: randInt(SKILL_RANGE[0], SKILL_RANGE[1]),
    stamina_skill: randInt(SKILL_RANGE[0], SKILL_RANGE[1]),
    carefulness: randInt(SKILL_RANGE[0], SKILL_RANGE[1]),
    speed: randInt(SKILL_RANGE[0], SKILL_RANGE[1]),
  }
}

export function generateCandidates(count: number): Candidate[] {
  const usedNames = new Set<string>()
  const candidates: Candidate[] = []

  for (let i = 0; i < count; i++) {
    let name: string
    do {
      name = ALL_NAMES[randInt(0, ALL_NAMES.length - 1)]
    } while (usedNames.has(name))
    usedNames.add(name)

    const skills = generateSkills()
    const shuffled = [...SKILL_KEYS].sort(() => Math.random() - 0.5)
    const revealedKeys = shuffled.slice(0, REVEALED_SKILL_COUNT)
    const hiddenKeys = shuffled.slice(REVEALED_SKILL_COUNT)

    const revealedSkills: Partial<Skill> = {}
    for (const key of revealedKeys) {
      revealedSkills[key] = skills[key]
    }

    const expectedSalary = randInt(SALARY_RANGE[0], SALARY_RANGE[1])

    candidates.push({
      id: `candidate_${Date.now()}_${i}`,
      name,
      revealedSkills,
      hiddenSkills: hiddenKeys,
      expectedSalary,
      skills,
    })
  }

  return candidates
}

export function calculateBargainSalary(salary: number): number {
  return Math.round(salary * (1 - BARGAIN_DISCOUNT_RATE))
}

export function shouldResign(employee: Employee): boolean {
  if (employee.mood >= MOOD_RESIGN_THRESHOLD) return false
  return Math.random() < MOOD_RESIGN_PROBABILITY
}

export function calculateMoodChange(employee: Employee, shop: Shop, month: number): number {
  let change = randInt(-2, 2)

  // Temperature penalty
  const tempPenalty = calculateTemperatureControlPenalty(shop, month)
  change -= tempPenalty

  // Work intensity factor: kitchen staff have higher intensity
  if (employee.position === 'kitchen') {
    change -= 1
  }

  // Random positive event: 10% chance of +3 mood
  if (Math.random() < 0.1) {
    change += 3
  }

  return change
}

export function calculateTemperatureControlPenalty(shop: Shop, month: number): number {
  const isHotMonth = SUMMER_MONTHS.includes(month)
  if (!isHotMonth) return 0

  // Calculate actual area coverage for storefront
  const fanStore = shop.furniture.find((f) => f.type === 'fan_store')
  const acStore = shop.furniture.find((f) => f.type === 'ac_store')
  const storefrontCoverage =
    (fanStore ? fanStore.count * FAN_AREA_COVERAGE : 0) +
    (acStore ? acStore.count * AC_AREA_COVERAGE : 0)

  // Calculate actual area coverage for kitchen
  const fanKitchen = shop.furniture.find((f) => f.type === 'fan_kitchen')
  const acKitchen = shop.furniture.find((f) => f.type === 'ac_kitchen')
  const kitchenCoverage =
    (fanKitchen ? fanKitchen.count * FAN_AREA_COVERAGE : 0) +
    (acKitchen ? acKitchen.count * AC_AREA_COVERAGE : 0)

  const storefrontArea = shop.floor1Area
  const kitchenArea = KITCHEN_AREA

  // Determine penalty based on coverage levels
  let storePenalty = 0
  if (storefrontCoverage >= storefrontArea) {
    storePenalty = 0
  } else if (storefrontCoverage >= storefrontArea / 2) {
    storePenalty = randInt(1, 3)
  } else {
    storePenalty = randInt(3, 5)
  }

  let kitchenPenalty = 0
  if (kitchenCoverage >= kitchenArea) {
    kitchenPenalty = 0
  } else if (kitchenCoverage >= kitchenArea / 2) {
    kitchenPenalty = randInt(1, 3)
  } else {
    kitchenPenalty = randInt(3, 5)
  }

  return storePenalty + kitchenPenalty
}
