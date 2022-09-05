import { ReactElement, useMemo, useRef } from 'react'
import { useComplexEffects, useForceUpdate } from 'some-utils/npm/react'
import { ObservableNumber } from 'some-utils/observables'
import { handleVerticalScroll } from './handleVerticalScroll'
import './VirtualScrollList.css'

type Props = {
  renderItem: (index: number) => ReactElement
  startInnerMargin?: number
  startOuterMargin?: number
  endInnerMargin?: number
  endOuterMargin?: number
}

type State = {
  status: 'init' | 'frame-update'
  startPositionOffset: number
  startIndexOffset: number
  viewHeight: number
  nodes: ReactElement[]
  children: HTMLElement[]
  position: ObservableNumber
}

type Bundle = {
  props: Props
  state: State
  updateState: (partialState: Partial<State>) => void
}

const init = ({ props, state, updateState }: Bundle) => {
  const {
    startInnerMargin = 200,
    endInnerMargin = 200,
    renderItem,
  } = props
  const {
    startIndexOffset,
    viewHeight,
    children,
    nodes,
  } = state

  const height = children.reduce((h, e) => h + e.offsetHeight, 0)

  // Step #1: Fill with inner items & "end-outer" items
  if (height < viewHeight + endInnerMargin) {
    const index = nodes.length
    const node = renderItem(index)
    updateState({
      nodes: [...nodes, node],
    })
  } 
  
  else {

    // Step #2: Post-fill with "start-outer" items
    const startHeight = children.slice(0, -startIndexOffset).reduce((h, e) => h + e.offsetHeight, 0)
    if (startHeight < startInnerMargin) {
      const startIndex = startIndexOffset - 1
      const node = renderItem(startIndex)
      updateState({ 
        nodes: [node, ...nodes], 
        startIndexOffset: startIndex,
      })
    } 
    
    // End of init.
    else {
      updateState({
        startPositionOffset: startHeight,
        status: 'frame-update',
      })
    }
  }
}

const frameUpdate = ({ props, state, updateState: update }: Bundle) => {
  const {
    children,
    startPositionOffset,
    position,
  } = state
  let currentPosition = position.value - startPositionOffset
  for (const child of children) {
    child.style.top = `${currentPosition}px`
    currentPosition += child.offsetHeight
  }
}

export const VirtualScrollList = (props: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const state = useMemo<State>(() => ({
    status: 'init',
    startPositionOffset: 0,
    startIndexOffset: 0,
    viewHeight: 0,
    children: [],
    nodes: [],
    position: new ObservableNumber(0),
  }), [])
  const forceUpdate = useForceUpdate({ waitNextFrame: false })
  const updateState = (partialState: Partial<State>) => {
    Object.assign(state, partialState)
    forceUpdate()
  }
  const bundle: Bundle = { props, state, updateState }

  useComplexEffects(function* () {
    const div = ref.current!
    state.children = [...div.children] as HTMLElement[]
    state.viewHeight = div.offsetHeight

    switch (state.status) {

      case 'init': {
        init(bundle)
        break
      }

      case 'frame-update': {
        yield state.position.withValue(() => {
          frameUpdate(bundle)
        })
        yield handleVerticalScroll(div, delta => {
          state.position.increment(delta)
        })
        break
      }
    }
  }, 'always-recalculate')
  return (
    <div ref={ref} className='VirtualScrollList'>
      {state.nodes}
    </div>
  )
}
