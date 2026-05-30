import { useState } from 'react'
import { useGame } from '../../core/GameContext'
import { RECIPE_RESEARCH_COST } from '../../core/constants'
import { fmtMoney } from '../../utils/format'
import type { SauceType, SauceLevel } from '../../types'
import Button from '../ui/Button'
import StatusBadge from '../ui/StatusBadge'

const SAUCE_CONFIG: { key: SauceType; name: string }[] = [
  { key: 'soy_sauce', name: '酱油' },
  { key: 'chili_oil', name: '辣椒油' },
  { key: 'vinegar', name: '醋' },
  { key: 'sugar', name: '糖' },
  { key: 'garlic', name: '蒜泥' },
  { key: 'sesame', name: '芝麻' },
  { key: 'cumin', name: '孜然粉' },
]

export default function RecipeScreen() {
  const { state, dispatch } = useGame()
  const { recipes, activeRecipeId, cash, stamina } = state

  const [sauces, setSauces] = useState<Record<SauceType, SauceLevel>>({
    soy_sauce: 0, chili_oil: 0, vinegar: 0, sugar: 0,
    garlic: 0, sesame: 0, cumin: 0,
  })

  const canResearch = cash >= RECIPE_RESEARCH_COST && stamina.current >= 2
  const totalSauce = Object.values(sauces).reduce((s, v) => s + v, 0)

  function handleSliderChange(key: SauceType, value: number) {
    setSauces(prev => ({ ...prev, [key]: value as SauceLevel }))
  }

  return (
    <div>
      <h2 className="screen-title">🔬 自研拌料</h2>

      <div className="card">
        <div className="card-title">配方研发台</div>
        <div className="recipe-slider-group">
          {SAUCE_CONFIG.map(sc => (
            <div key={sc.key} className="recipe-slider-item">
              <label>{sc.name}</label>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={sauces[sc.key]}
                onChange={e => handleSliderChange(sc.key, Number(e.target.value))}
              />
              <span className="slider-value">{sauces[sc.key]}</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', margin: '8px 0' }}>
          当前组合：{SAUCE_CONFIG.map(sc => sauces[sc.key] > 0 ? `${sc.name}${sauces[sc.key]}` : '').filter(Boolean).join(' + ') || '未选择'}
          <br />
          总调料量：{totalSauce}/21
        </div>

        <div className="cost-hint mb-8">
          研发费用：<span className="cost-value">{fmtMoney(RECIPE_RESEARCH_COST)}元</span>，
          消耗体力：<span className="cost-value">2点</span>
        </div>

        <Button
          variant="primary"
          disabled={!canResearch || totalSauce === 0}
          onClick={() => dispatch({ type: 'RESEARCH_RECIPE', payload: sauces })}
        >
          开始研发
        </Button>
        {!canResearch && totalSauce > 0 && (
          <div className="text-red text-sm mt-8">
            {cash < RECIPE_RESEARCH_COST ? '现金不足' : '体力不足（需要2点）'}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">已研发配方</div>
        {recipes.length === 0 ? (
          <p className="text-gray text-sm">尚未研发任何配方</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>配方名</th>
                <th>评分</th>
                <th>专利</th>
                <th>当前使用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(recipe => (
                <tr key={recipe.id}>
                  <td>{recipe.name}</td>
                  <td>
                    <StatusBadge
                      status={recipe.score >= 8 ? 'success' : recipe.score >= 5 ? 'warning' : 'danger'}
                      text={`${recipe.score}分`}
                    />
                  </td>
                  <td>
                    {recipe.isPatented ? (
                      <StatusBadge status="success" text="已专利" />
                    ) : recipe.score >= 8 ? (
                      <Button variant="secondary" size="sm" onClick={() => dispatch({ type: 'PATENT_RECIPE', payload: { recipeId: recipe.id } })}>
                        申请专利
                      </Button>
                    ) : (
                      <span className="text-gray text-sm">评分不足</span>
                    )}
                  </td>
                  <td>{activeRecipeId === recipe.id ? '✅ 使用中' : ''}</td>
                  <td>
                    {activeRecipeId !== recipe.id && (
                      <Button variant="primary" size="sm" onClick={() => dispatch({ type: 'SET_ACTIVE_RECIPE', payload: { recipeId: recipe.id } })}>
                        保存当前配方
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
