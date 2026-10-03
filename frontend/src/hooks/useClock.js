/**
 * hooks/useClock.js
 *
 * Returns a live-updating date/time string for the header clock.
 * Updates every second via setInterval.
 */
import { useState, useEffect } from 'react'

function formatDateTime(date) {
  const dayNames  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const day     = dayNames[date.getDay()]
  const d       = String(date.getDate()).padStart(2, '0')
  const month   = monthNames[date.getMonth()]
  const year    = date.getFullYear()
  const hours   = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return { date: `${day}, ${d} ${month} ${year}`, time: `${hours}:${minutes}:${seconds}` }
}

export function useClock() {
  const [clock, setClock] = useState(() => formatDateTime(new Date()))

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(formatDateTime(new Date()))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return clock
}
