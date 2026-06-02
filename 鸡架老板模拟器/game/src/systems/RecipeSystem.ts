import type { SauceType, SauceLevel, Recipe, RecipeScore } from '../types'
import { CLASSIC_RECIPES, RECIPE_SCORE_WEIGHTS } from '../core/constants'

const SAUCE_TYPES: SauceType[] = [
  'soy_sauce', 'chili_oil', 'vinegar', 'sugar', 'garlic', 'sesame', 'cumin',
]

const SAUCE_NAMES: Record<SauceType, string> = {
  soy_sauce: '酱油',
  chili_oil: '辣椒油',
  vinegar: '醋',
  sugar: '糖',
  garlic: '蒜',
  sesame: '芝麻',
  cumin: '孜然',
}

const LEVEL_NAMES: Record<SauceLevel, string> = {
  0: '',
  1: '微',
  2: '中',
  3: '重',
}

function getNonZeroSauces(sauces: Record<SauceType, SauceLevel>): { type: SauceType; level: SauceLevel }[] {
  return SAUCE_TYPES
    .filter((t) => sauces[t] > 0)
    .map((t) => ({ type: t, level: sauces[t] }))
}

function calculateFlavorBalance(sauces: Record<SauceType, SauceLevel>): number {
  const count = getNonZeroSauces(sauces).length
  if (count >= 3 && count <= 5) return 8 + Math.random() * 2
  if (count <= 2) return 3 + Math.random() * 2
  return 4 + Math.random() * 2
}

function calculateHarmony(sauces: Record<SauceType, SauceLevel>): number {
  const nonZero = getNonZeroSauces(sauces).map((s) => s.level)
  if (nonZero.length === 0) return 0
  const mean = nonZero.reduce((a: number, b) => a + b, 0) / nonZero.length
  const variance = nonZero.reduce((sum: number, v) => sum + (v - mean) ** 2, 0) / nonZero.length
  const stdDev = Math.sqrt(variance)
  if (stdDev <= 0.3) return 9 + Math.random()
  if (stdDev <= 0.8) return 7 + Math.random() * 2
  if (stdDev <= 1.2) return 5 + Math.random() * 2
  return 3 + Math.random() * 2
}

export function isClassicMatch(sauces: Record<SauceType, SauceLevel>, classic: Recipe): number {
  let totalDiff = 0
  let maxDiff = 0
  for (const st of SAUCE_TYPES) {
    const diff = Math.abs(sauces[st] - classic.sauces[st])
    totalDiff += diff
    maxDiff += 3
  }
  return 1 - totalDiff / maxDiff
}

function calculateClassicBonus(sauces: Record<SauceType, SauceLevel>): number {
  let bestMatch = 0
  for (const classic of CLASSIC_RECIPES) {
    const similarity = isClassicMatch(sauces, classic)
    if (similarity > bestMatch) bestMatch = similarity
  }
  return bestMatch * 10
}

function calculateInnovation(sauces: Record<SauceType, SauceLevel>): number {
  let bestMatch = 1
  for (const classic of CLASSIC_RECIPES) {
    const similarity = isClassicMatch(sauces, classic)
    if (similarity < bestMatch) bestMatch = similarity
  }
  return bestMatch * 10
}

export function scoreRecipe(sauces: Record<SauceType, SauceLevel>): RecipeScore {
  const flavorBalance = calculateFlavorBalance(sauces)
  const harmony = calculateHarmony(sauces)
  const classicBonus = calculateClassicBonus(sauces)
  const innovation = calculateInnovation(sauces)
  const randomBonus = -1 + Math.random() * 2

  const total = Math.round(
    Math.max(1, Math.min(10,
      flavorBalance * RECIPE_SCORE_WEIGHTS.flavorBalance +
      harmony * RECIPE_SCORE_WEIGHTS.harmony +
      classicBonus * RECIPE_SCORE_WEIGHTS.classicBonus +
      innovation * RECIPE_SCORE_WEIGHTS.innovation +
      randomBonus * RECIPE_SCORE_WEIGHTS.randomBonus
    )) * 10
  ) / 10

  return {
    flavorBalance: Math.round(flavorBalance * 10) / 10,
    harmony: Math.round(harmony * 10) / 10,
    classicBonus: Math.round(classicBonus * 10) / 10,
    innovation: Math.round(innovation * 10) / 10,
    randomBonus: Math.round(randomBonus * 10) / 10,
    total,
  }
}

export function generateRecipeName(sauces: Record<SauceType, SauceLevel>): string {
  const nonZero = getNonZeroSauces(sauces)
  if (nonZero.length === 0) return '白味鸡架'

  const dominant = nonZero.reduce((a, b) => a.level >= b.level ? a : b)
  const prefix = LEVEL_NAMES[dominant.level] || ''
  const mainFlavor = SAUCE_NAMES[dominant.type]

  if (nonZero.length === 1) return `${prefix}${mainFlavor}鸡架`

  const secondary = nonZero
    .filter((s) => s.type !== dominant.type)
    .sort((a, b) => b.level - a.level)[0]
  const secondFlavor = SAUCE_NAMES[secondary.type]

  return `${prefix}${mainFlavor}${secondFlavor}鸡架`
}
