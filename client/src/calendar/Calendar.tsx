import { useMemo } from 'react'
import { handleFrame, handlePointer } from 'some-utils/dom'
import { range } from 'some-utils/iterators'
import { clampModulo } from 'some-utils/math'
import { useForceUpdate, useRefComplexEffects } from 'some-utils/npm/react'
import { ObservableNumber } from 'some-utils/observables'
import { DayCard } from './day/DayCard'
import './Calendar.css'

const handleVerticalScroll = function* (
  element: HTMLElement,
  onScroll: (scrollDelta: number) => void,
) {
  let delta = 0
  let drag = false
  yield handlePointer(element, {
    onVerticalDrag: info => {
      delta = info.delta.y
    },
    onDown: () => {
      delta = 0
    },
    onVerticalDragStart: () => {
      drag = true
    },
    onVerticalDragStop: () => {
      drag = false
    },
  })
  yield handleFrame(() => {
    if (drag === false) {
      delta *= .95
    }
    if (Math.abs(delta) > .1) {
      onScroll(delta)
    }
  })
}

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
    yield* handleVerticalScroll(div, delta => {
      offset.value += delta
    })
  }, [])
  const now = new Date()
  return (
    <div ref={ref} className='Calendar flex column expand'>
      <div className='Month wrapper'>December</div>
      <div className='Day wrapper'>
        {state.dayOffsets.map((index, dayOffset) => (
          <div key={dayOffset} className='Day card flex column center'>
            <DayCard date={new Date(now.getFullYear(), now.getMonth(), now.getDate() + index)} />
          </div>
        ))}
      </div>
    </div>
  )
}
