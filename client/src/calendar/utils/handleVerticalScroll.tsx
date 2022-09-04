import { handleFrame, handlePointer } from 'some-utils/dom'

export const handleVerticalScroll = (
  element: HTMLElement,
  onScroll: (scrollDelta: number) => void
) => {
  let delta = 0
  let drag = false
  const listenerPointer = handlePointer(element, {
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
  const listenerFrame = handleFrame(() => {
    if (drag === false) {
      delta *= .95
    }
    if (Math.abs(delta) > .1) {
      onScroll(delta)
    }
  })
  const destroy = () => {
    listenerPointer.destroy()
    listenerFrame.destroy()
  }
  return { destroy }
}
