import { useState } from 'react'
import { useGame } from '../../core/GameContext'
import { fmtMoney } from '../../utils/format'
import type { Position } from '../../types'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import StatusBadge from '../ui/StatusBadge'

type TabKey = 'recruit' | 'assign' | 'communicate' | 'info'

const POSITION_LABELS: Record<Position, string> = {
  cashier: '收银',
  waiter: '服务员',
  kitchen: '后厨',
  none: '未分配',
}

const SKILL_LABELS: Record<string, string> = {
  speechcraft: '口才',
  patience: '耐心',
  stamina_skill: '体力',
  carefulness: '细心',
  speed: '速度',
}

export default function PersonnelScreen() {
  const { state, dispatch } = useGame()
  const { employees, pendingHires, cash, stamina } = state
  const regularEmployeeCount = employees.filter(e => !e.isIntern).length
  const atMaxStaff = regularEmployeeCount >= state.shop.maxStaff
  const [activeTab, setActiveTab] = useState<TabKey>('recruit')
  const [fireTarget, setFireTarget] = useState<{id: string; name: string; salary: number} | null>(null)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'recruit', label: '招募新员工' },
    { key: 'assign', label: '分配岗位' },
    { key: 'communicate', label: '员工沟通' },
    { key: 'info', label: '员工信息' },
  ]

  return (
    <div>
      <h2 className="screen-title">👥 店员管理</h2>

      <div className="tab-bar">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {activeTab === 'recruit' && (
        <div>
          {pendingHires.length === 0 ? (
            <div className="card">
              <p className="text-gray text-sm mb-8">当前没有待确认的候选人</p>
              <Button
                variant="primary"
                size="sm"
                disabled={cash < 2000 || stamina.current < 1 || atMaxStaff}
                onClick={() => dispatch({ type: 'RECRUIT_EMPLOYEES' })}
              >
                招募员工（消耗2000元+1体力）{atMaxStaff ? ' [编制已满]' : ''}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={cash < 2000 || stamina.current < 1}
                onClick={() => dispatch({ type: 'HIRE_INTERN' })}
              >
                招募实习生（2000元+1体力）
              </Button>
            </div>
          ) : (
            pendingHires.map(candidate => (
              <div key={candidate.id} className="employee-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="employee-name">{candidate.name}</span>
                    <span className="ml-8">
                      <StatusBadge status="warning" text={`期望薪资 ${fmtMoney(candidate.expectedSalary)}元/月`} />
                    </span>
                  </div>
                </div>
                <div className="mt-8">
                  <div className="text-sm text-bold mb-8">已展示技能：</div>
                  {Object.entries(candidate.revealedSkills).map(([skill, value]) => (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--pixel-font)', width: '50px' }}>{SKILL_LABELS[skill] ?? skill}</span>
                      <ProgressBar value={value as number} max={10} color="gold" />
                    </div>
                  ))}
                  {candidate.hiddenSkills.length > 0 && (
                    <div className="text-gray text-sm mt-8">
                      隐藏技能：{candidate.hiddenSkills.map(s => SKILL_LABELS[s] ?? s).join('、')}（入职后揭示）
                    </div>
                  )}
                </div>
                <div className="mt-8 inline-flex">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => dispatch({ type: 'HIRE_EMPLOYEE', payload: { candidateId: candidate.id, bargain: false } })}
                  >
                    原价雇佣（{fmtMoney(candidate.expectedSalary)}元/月）
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => dispatch({ type: 'HIRE_EMPLOYEE', payload: { candidateId: candidate.id, bargain: true } })}
                  >
                    砍价雇佣（{fmtMoney(Math.round(candidate.expectedSalary * 0.8))}元/月，40%失败率）
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'assign' && (
        <div>
          {employees.length === 0 ? (
            <div className="card">
              <p className="text-gray text-sm">暂无员工</p>
            </div>
          ) : (
            employees.map(emp => (
              <div key={emp.id} className="employee-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="employee-name">{emp.name}{emp.isIntern ? '(实习生)' : ''}</span>
                  <StatusBadge status={emp.position === 'none' ? 'warning' : 'success'} text={POSITION_LABELS[emp.position]} />
                </div>
                <div className="mt-8" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '120px' }}>
                    <select
                      value={emp.position}
                      onChange={e => dispatch({ type: 'ASSIGN_POSITION', payload: { employeeId: emp.id, position: e.target.value as Position } })}
                    >
                      <option value="none">未分配</option>
                      <option value="cashier">收银</option>
                      <option value="waiter">服务员</option>
                      <option value="kitchen">后厨</option>
                    </select>
                  </div>
                  {!emp.isIntern && (
                    <Button
                      variant={emp.isDualRole ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => dispatch({ type: 'TOGGLE_DUAL_ROLE', payload: { employeeId: emp.id } })}
                    >
                      {emp.isDualRole ? '取消兼职' : '开启兼职'}
                    </Button>
                  )}
                </div>
                {emp.isDualRole && (
                  <div className="text-sm text-red mt-8">
                    ⚠️ 兼职效率降低15%，有20%概率收到客诉
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'communicate' && (
        <div>
          {employees.length === 0 ? (
            <div className="card">
              <p className="text-gray text-sm">暂无员工</p>
            </div>
          ) : (
            employees.map(emp => (
              <div key={emp.id} className="employee-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="employee-name">{emp.name}{emp.isIntern ? '(实习生)' : ''}</span>
                  <StatusBadge
                    status={emp.mood >= 70 ? 'success' : emp.mood >= 40 ? 'warning' : 'danger'}
                    text={`心情 ${emp.mood}`}
                  />
                </div>
                <div className="mt-8">
                  <ProgressBar
                    value={emp.mood}
                    max={100}
                    color={emp.mood >= 70 ? 'green' : emp.mood >= 40 ? 'orange' : 'red'}
                    label="心情值"
                  />
                </div>
                {emp.mood <= 30 && (
                  <div className="text-red text-sm mt-8">
                    ⚠️ 心情过低，{emp.isIntern ? '实习生可能离职' : '员工可能辞职'}！
                  </div>
                )}
                <div className="mt-8 inline-flex" style={{ gap: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={state.stamina.current < 1}
                    onClick={() => dispatch({ type: 'TALK_TO_EMPLOYEE', payload: { employeeId: emp.id } })}
                  >
                    谈心（1体力，50%情绪+10）
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={state.stamina.current < 1}
                    onClick={() => dispatch({ type: 'PUSH_EMPLOYEE', payload: { employeeId: emp.id } })}
                  >
                    Push（1体力，50%随机能力+1/50%情绪-10）
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (emp.isIntern) {
                        dispatch({ type: 'FIRE_EMPLOYEE', payload: { employeeId: emp.id } })
                      } else if (confirm(`确认辞退${emp.name}？需支付遣散费${fmtMoney(emp.salary)}元`)) {
                        dispatch({ type: 'FIRE_EMPLOYEE', payload: { employeeId: emp.id } })
                      }
                    }}
                  >
                    {emp.isIntern ? '辞退（无遣散费）' : `辞退（支付${fmtMoney(emp.salary)}元）`}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div>
          {employees.length === 0 ? (
            <div className="card">
              <p className="text-gray text-sm">暂无员工</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>岗位</th>
                  <th>口才</th>
                  <th>耐心</th>
                  <th>体力</th>
                  <th>细心</th>
                  <th>速度</th>
                  <th>薪资</th>
                  <th>心情</th>
                  <th>兼职</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.name}{emp.isIntern ? '(实习生)' : ''}</td>
                    <td>{POSITION_LABELS[emp.position]}</td>
                    <td>{emp.skills.speechcraft}</td>
                    <td>{emp.skills.patience}</td>
                    <td>{emp.skills.stamina_skill}</td>
                    <td>{emp.skills.carefulness}</td>
                    <td>{emp.skills.speed}</td>
                    <td>{fmtMoney(emp.salary)}元</td>
                    <td>
                      <StatusBadge
                        status={emp.mood >= 70 ? 'success' : emp.mood >= 40 ? 'warning' : 'danger'}
                        text={`${emp.mood}`}
                      />
                    </td>
                    <td>{emp.isIntern ? '—' : (emp.isDualRole ? '✅' : '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {fireTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
        }}>
          <div style={{
            maxWidth: '360px', width: '100%', background: 'var(--color-cream, #fdf6e3)',
            borderRadius: '12px', padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '16px' }}>
              确认辞退
            </div>
            <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '13px', lineHeight: '2', color: '#333', marginBottom: '16px' }}>
              确认辞退{fireTarget.name}？<br/>需支付遣散费{fmtMoney(fireTarget.salary)}元
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => {
                dispatch({ type: 'FIRE_EMPLOYEE', payload: { employeeId: fireTarget.id } })
                setFireTarget(null)
              }}>
                确认辞退
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setFireTarget(null)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
