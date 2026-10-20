import type { ReactNode } from 'react'
import { input } from '../../engine/input'
import { useTarget } from '../../engine/hooks'
import { SymbolIcon } from '../../lens/SkillIcon'
export function Action({ id, children, onSelect, primary = false, active = false, icon, disabled = false, className = '', label }: {
  id: string; children: ReactNode; onSelect: () => void; primary?: boolean; active?: boolean; icon?: string; disabled?: boolean; className?: string; label?: string
}) {
  const ref = useTarget<HTMLButtonElement>(id, { enabled: !disabled, priority: 4, pad: 4, dwellMs: 160, onSelect, hand: true })
  return <button ref={ref} type="button" aria-label={label} title={label} className={`f1-action ${primary ? 'is-primary' : ''} ${active ? 'is-active' : ''} ${className}`} disabled={disabled} onClick={event => { if (event.detail === 0 && !input.pinching) onSelect() }} aria-pressed={active || undefined}>
    {icon && <SymbolIcon name={icon} size={17} />}{children}
  </button>
}
