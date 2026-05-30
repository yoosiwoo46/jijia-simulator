import { useGame } from '../../core/GameContext'
import { FURNITURE_CONFIG_MAP, SHOP_CONFIG, REQUIRED_FURNITURE_TYPES } from '../../core/constants'
import { fmtMoney } from '../../utils/format'
import type { FurnitureType } from '../../types'
import Button from '../ui/Button'
import StatusBadge from '../ui/StatusBadge'

export default function FurnitureScreen() {
  const { state, dispatch } = useGame()
  const { shop, cash, stamina, hasBeerLicense } = state

  const furnitureMap = new Map(shop.furniture.map(f => [f.type, { count: f.count, brokenCount: f.brokenCount ?? 0 }]))

  function getFurnitureCount(type: FurnitureType): number {
    return furnitureMap.get(type)?.count ?? 0
  }

  const canExpand = shop.floor1Area < SHOP_CONFIG.maxFloor1Area && cash >= SHOP_CONFIG.expansionCost && stamina.current >= 1
  const canBuildFloor2 = shop.floor1Area >= SHOP_CONFIG.maxFloor1Area && !shop.hasFloor2 && cash >= SHOP_CONFIG.floor2Cost && stamina.current >= 1

  const storefrontCoverage = shop.furniture
    .filter(f => {
      const cfg = FURNITURE_CONFIG_MAP.get(f.type)
      return cfg?.isStorefront && (f.type === 'fan_store' || f.type === 'ac_store')
    })
    .reduce((sum, f) => {
      const cfg = FURNITURE_CONFIG_MAP.get(f.type)
      return sum + (cfg?.area ?? 0) * f.count
    }, 0)

  const kitchenCoverage = shop.furniture
    .filter(f => {
      const cfg = FURNITURE_CONFIG_MAP.get(f.type)
      return !cfg?.isStorefront && (f.type === 'fan_kitchen' || f.type === 'ac_kitchen')
    })
    .reduce((sum, f) => {
      const cfg = FURNITURE_CONFIG_MAP.get(f.type)
      return sum + (cfg?.area ?? 0) * f.count
    }, 0)

  return (
    <div>
      <h2 className="screen-title">🪑 店铺装潢</h2>

      <div className="card mb-12">
        <div className="card-title">店铺信息</div>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px' }}>
          <div>一层面积：{shop.floor1Area}㎡ / {SHOP_CONFIG.maxFloor1Area}㎡</div>
          <div>二层：{shop.hasFloor2 ? '已修建' : '未修建'}</div>
          <div>最大员工：{shop.maxStaff}人</div>
          <div>最大客容量：{shop.maxCustomers}人</div>
          <div>月租金：{fmtMoney(shop.rent)}元</div>
          <div className="mt-8">
            店面温控覆盖：{storefrontCoverage}㎡
            {storefrontCoverage < shop.floor1Area && <span className="text-red">（不足）</span>}
          </div>
          <div>
            后厨温控覆盖：{kitchenCoverage}㎡
          </div>
        </div>
      </div>

      <div className="card mb-12">
        <div className="card-title">购买家具</div>
        <div className="furniture-grid">
          {Array.from(FURNITURE_CONFIG_MAP.entries()).map(([type, cfg]) => {
            const count = getFurnitureCount(type)
            const brokenCount = furnitureMap.get(type)?.brokenCount ?? 0
            const canBuy = cash >= cfg.price && stamina.current >= 1
            const isRequired = REQUIRED_FURNITURE_TYPES.includes(type)

            return (
              <div key={type} className={`furniture-card ${isRequired ? 'required' : ''}`}>
                <div className="furniture-name">
                  {cfg.name}
                  {isRequired && <StatusBadge status="danger" text="必需" />}
                </div>
                <div className="furniture-price">{fmtMoney(cfg.price)}元</div>
                <div className="furniture-count">已拥有：{count}</div>
                {brokenCount > 0 && (
                  <div style={{ color: '#e74c3c', fontFamily: 'var(--pixel-font)', fontSize: '11px', marginTop: '2px' }}>
                    🔧 损坏{brokenCount}台（维修费{fmtMoney(brokenCount * cfg.repairCost)}元）
                  </div>
                )}
                {cfg.area > 0 && <div className="text-gray text-sm">温控面积：{cfg.area}㎡</div>}
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!canBuy}
                    onClick={() => dispatch({ type: 'BUY_FURNITURE', payload: { furnitureType: type } })}
                  >
                    购买
                  </Button>
                  {brokenCount > 0 && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={cash < brokenCount * cfg.repairCost}
                      onClick={() => dispatch({ type: 'REPAIR_FURNITURE', payload: { furnitureType: type } })}
                    >
                      维修
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mb-12">
        <div className="card-title">店铺扩张</div>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px' }}>
          <div className="mb-8">
            扩张一层（+{SHOP_CONFIG.expansionAreaIncrement}㎡）：
            <span className="text-red">{fmtMoney(SHOP_CONFIG.expansionCost)}元</span>，
            月租+{fmtMoney(SHOP_CONFIG.expansionRentIncrement)}元
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={!canExpand}
            onClick={() => dispatch({ type: 'EXPAND_SHOP' })}
          >
            扩张一层
          </Button>

          <div className="mt-12 mb-8">
            修建二层（+{SHOP_CONFIG.floor2StaffCapacity}员工容量，+{SHOP_CONFIG.floor2CustomerCapacity}客容量）：
            <span className="text-red">{fmtMoney(SHOP_CONFIG.floor2Cost)}元</span>，
            月租+{fmtMoney(SHOP_CONFIG.floor2RentIncrement)}元
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={!canBuildFloor2}
            onClick={() => dispatch({ type: 'BUILD_FLOOR2' })}
          >
            修建二层
          </Button>
          {!shop.hasFloor2 && shop.floor1Area < SHOP_CONFIG.maxFloor1Area && (
            <div className="text-gray text-sm mt-8">需先扩张一层至{SHOP_CONFIG.maxFloor1Area}㎡</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">啤酒许可证</div>
        <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px' }}>
          {hasBeerLicense ? (
            <StatusBadge status="success" text="已获得啤酒销售许可" />
          ) : (
            <>
              <div className="mb-8">获得啤酒销售许可后可售卖啤酒类商品</div>
              <Button
                variant="primary"
                size="sm"
                disabled={stamina.current < 1}
                onClick={() => dispatch({ type: 'GET_BEER_LICENSE' })}
              >
                申请啤酒许可证（消耗1体力）
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
