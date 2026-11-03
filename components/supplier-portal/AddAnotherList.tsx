'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * A list of repeating form groups the supplier can add to, remove from and,
 * optionally, reorder.
 * [Provenance: Bespoke — neither the NHS nor the GOV.UK design system has an
 * "add another" component. Adapted from the MoJ "Add another" pattern (as the
 * onboarding multi-upload is): each item is an NHS fieldset with a numbered
 * legend, actions are NHS secondary buttons, and focus moves to the new item.]
 */
export function AddAnotherList<T>({
  id,
  items,
  onChange,
  newItem,
  itemName,
  renderItem,
  reorderable = false,
}: {
  id: string
  items: T[]
  onChange: (items: T[]) => void
  newItem: () => T
  /** Singular noun for legends and buttons, e.g. "step" or "publication". */
  itemName: string
  /** The NHS form fields for one item. `update` merges changes into it. */
  renderItem: (item: T, index: number, update: (next: T) => void) => ReactNode
  /** Show Move up / Move down (for ordered lists such as pathway steps). */
  reorderable?: boolean
}) {
  const focusIndex = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const label = itemName.charAt(0).toUpperCase() + itemName.slice(1)

  useEffect(() => {
    if (focusIndex.current === null) return
    const legend = containerRef.current?.querySelector<HTMLElement>(`#${id}-item-${focusIndex.current}-legend`)
    legend?.focus()
    focusIndex.current = null
  })

  const replace = (index: number, next: T) => onChange(items.map((item, i) => (i === index ? next : item)))
  const remove = (index: number) => {
    focusIndex.current = Math.max(0, Math.min(index, items.length - 2))
    onChange(items.filter((_, i) => i !== index))
  }
  const move = (index: number, by: -1 | 1) => {
    const target = index + by
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    focusIndex.current = target
    onChange(next)
  }
  const add = () => {
    focusIndex.current = items.length
    onChange([...items, newItem()])
  }

  return (
    <div id={id} ref={containerRef} className="hs-add-another">
      {items.map((item, index) => (
        <fieldset key={index} className="nhsuk-fieldset hs-add-another__item">
          <legend
            id={`${id}-item-${index}-legend`}
            tabIndex={-1}
            className="nhsuk-fieldset__legend nhsuk-fieldset__legend--s outline-none"
          >
            {label} {index + 1}
          </legend>
          {renderItem(item, index, (next) => replace(index, next))}
          <div className="hs-add-another__actions">
            {reorderable && index > 0 && (
              <Button type="button" variant="secondary" onClick={() => move(index, -1)}>
                Move up<span className="nhsuk-u-visually-hidden"> {itemName} {index + 1}</span>
              </Button>
            )}
            {reorderable && index < items.length - 1 && (
              <Button type="button" variant="secondary" onClick={() => move(index, 1)}>
                Move down<span className="nhsuk-u-visually-hidden"> {itemName} {index + 1}</span>
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => remove(index)}>
              Remove<span className="nhsuk-u-visually-hidden"> {itemName} {index + 1}</span>
            </Button>
          </div>
        </fieldset>
      ))}
      <Button type="button" variant="secondary" onClick={add}>
        {items.length === 0 ? `Add a ${itemName}` : `Add another ${itemName}`}
      </Button>
    </div>
  )
}
