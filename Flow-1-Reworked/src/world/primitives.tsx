import { createContext, forwardRef, useContext, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { registerFace } from './projection'

const World = createContext({ matrix: new DOMMatrix(), layer: 1 })


// World units are millimetres in eye-space: eye at origin, y down, -z ahead.

type PlaneProps = {
  x?: number
  y?: number
  z?: number
  w: number
  h: number
  rx?: number
  ry?: number
  rz?: number
  /** render at 1/res size then scale up — for large, soft surfaces */
  res?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export const Plane = forwardRef<HTMLDivElement, PlaneProps>(function Plane(
  { x = 0, y = 0, z = 0, w, h, rx = 0, ry = 0, rz = 0, res = 1, className = '', style, children },
  ref,
) {
  const pw = w / res
  const ph = h / res
  const parent = useContext(World)
  const localRef = useRef<HTMLDivElement>(null)
  const world = useMemo(() => parent.matrix.translate(x, y, z).rotateAxisAngle(0, 1, 0, ry).rotateAxisAngle(1, 0, 0, rx).rotateAxisAngle(0, 0, 1, rz).scale(res).translate(-pw / 2, -ph / 2), [parent.matrix, x, y, z, ry, rx, rz, res, pw, ph])
  useLayoutEffect(() => {
    const el = localRef.current
    if (!el) return
    return registerFace(el, world, pw, ph, parent.layer)
  }, [world, pw, ph, parent.layer])
  return (
    <div ref={(el) => {
      localRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    }} className={`plane ${className}`} style={{ width: pw, height: ph, ...style, transformOrigin: '0 0', backfaceVisibility: 'visible' }}>
      {children}
    </div>
  )
})

type GroupProps = {
  layer?: number
  x?: number
  y?: number
  z?: number
  rx?: number
  ry?: number
  style?: CSSProperties
  className?: string
  children?: ReactNode
}
export const Group = forwardRef<HTMLDivElement, GroupProps>(function Group(
  { x = 0, y = 0, z = 0, rx = 0, ry = 0, layer, style, className = '', children }, ref,
) {
  const parent = useContext(World)
  const value = useMemo(() => ({ matrix: parent.matrix.translate(x, y, z).rotateAxisAngle(0, 1, 0, ry).rotateAxisAngle(1, 0, 0, rx), layer: layer ?? parent.layer }), [parent.matrix, parent.layer, x, y, z, ry, rx, layer])
  return <World.Provider value={value}><div ref={ref} className={className} style={{ ...style, display: 'contents' }}>{children}</div></World.Provider>
})

type BoxFaces = { front?: CSSProperties; top?: CSSProperties; left?: CSSProperties; right?: CSSProperties }
/** A solid box centred at (x,y,z). Only faces a seated viewer can see are drawn. */
export function Box({
  x = 0,
  y = 0,
  z = 0,
  w,
  h,
  d,
  faces,
  frontChildren,
  topChildren,
  frontRef,
}: {
  x?: number
  y?: number
  z?: number
  w: number
  h: number
  d: number
  faces: BoxFaces
  frontChildren?: ReactNode
  topChildren?: ReactNode
  frontRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <Group x={x} y={y} z={z}>
      {faces.top && (
        <Plane y={-h / 2} w={w} h={d} rx={90} style={faces.top}>
          {topChildren}
        </Plane>
      )}
      {faces.left && <Plane x={-w / 2} w={d} h={h} ry={-90} style={faces.left} />}
      {faces.right && <Plane x={w / 2} w={d} h={h} ry={90} style={faces.right} />}
      <Plane ref={frontRef} z={d / 2} w={w} h={h} style={faces.front}>
        {frontChildren}
      </Plane>
    </Group>
  )
}
