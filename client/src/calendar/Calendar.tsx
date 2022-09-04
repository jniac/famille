import { useMemo } from 'react'
import { range } from 'some-utils/iterators'
import { clampModulo } from 'some-utils/math'
import { useForceUpdate, useRefComplexEffects } from 'some-utils/npm/react'
import { ObservableNumber } from 'some-utils/observables'
import { DayCard } from './day/DayCard'
import { handleVerticalScroll } from './utils/handleVerticalScroll'
import './Calendar.css'

export const Calendar = () => {

  const count = 5
  const update = useForceUpdate({ waitNextFrame: false })
  const state = useMemo(() => {
    return {
      dayOffsets: [...range(count)],
    }
  }, [])

  const ref = useRefComplexEffects<HTMLDivElement>(function* (div) {
    const cards = [...div.querySelectorAll('.Day.card')] as HTMLDivElement[]
    const offset = new ObservableNumber(0)
    const height = 200
    offset.withValue(offset => {
      const x = Math.ceil(-offset / 200)
      const newDayOffsets = [...range(count)].map(index => {
        return clampModulo(index, x - 1, x - 1 + count)
      })
      for (const [index, card] of cards.entries()) {
        const dayOffset = newDayOffsets[index]
        card.style.top = `${height * dayOffset + offset}px`
      }
      const hasChanged = state.dayOffsets.some((dayOffset, index) => newDayOffsets[index] !== dayOffset)
      if (hasChanged) {
        state.dayOffsets = newDayOffsets
        update()
      }
    })
    yield offset
    yield handleVerticalScroll(div, delta => {
      offset.value += delta
    })
  }, [])

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()
  return (
    <div ref={ref} className='Calendar flex column expand'>
      <div className='Month wrapper'>December</div>
      <div className='Day wrapper'>
        {state.dayOffsets.map((dayOffset, index) => (
          <div key={index} className='Day card flex column center'>
            <DayCard date={new Date(year, month, date + dayOffset)} />
          </div>
        ))}
      </div>
    </div>
  )
}
