/**
 * lib/utils.js
 *
 * Utility helpers for composing Tailwind class names cleanly.
 * Uses `clsx` for conditional classes and `tailwind-merge` to
 * resolve Tailwind conflicts (e.g. `p-4 p-6` → `p-6`).
 */
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn(...inputs)
 * Drop-in replacement for `className` prop composition.
 *
 * @example
 *   cn('text-sm', isActive && 'text-cyan-400', 'px-2')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
