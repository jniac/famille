import { ReactElement, useEffect, useMemo, useRef } from 'react'
import { useComplexEffects, useForceUpdate } from 'some-utils/npm/react'
import { ObservableNumber } from 'some-utils/observables'
import { handleVerticalScroll } from './handleVerticalScroll'
import './VirtualScrollList.css'

const defaultProps = {
  startInnerMargin: 200,
  startOuterMargin: 400,
  endInnerMargin: 200,
  endOuterMargin: 400,
}

type Props = {
  renderItem: (index: number) => ReactElement
} & Partial<typeof defaultProps>

const propsWithDefault = (props: Props) => ({ ...defaultProps, ...props})

type State = {
  status: 'init' | 'init-done' | 'position-update' | 'prepend'
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

const createState = (): State => ({
  status: 'init',
  startPositionOffset: 0,
  startIndexOffset: 0,
  viewHeight: 0,
  children: [],
  nodes: [],
  position: new ObservableNumber(0),
})

const init = ({ props, state, updateState }: Bundle) => {
  const {
    startInnerMargin,
    endInnerMargin,
    renderItem,
  } = propsWithDefault(props)
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
        status: 'init-done',
      })
    }
  }
}

const afterInit = (bundle: Bundle) => {
  positionUpdate(bundle)
  const { updateState } = bundle
  updateState({ status: 'position-update' })
}

const positionUpdate = ({ props, state, updateState }: Bundle) => {
  const {
    renderItem,
    startInnerMargin,
    startOuterMargin,
    endInnerMargin,
    endOuterMargin,
  } = propsWithDefault(props)
  const {
    children,
    nodes,
    startIndexOffset,
    startPositionOffset,
    position,
    viewHeight,
  } = state

  // Step #0: Compute metrics (height, offset).
  const metrics = (() => {
    let offset = 0
    return children.map((child, index) => {
      const height = child.offsetHeight
      const start = position.value - startPositionOffset + offset
      const end = start + height
      offset += height
      return {
        height,
        offset,
        start,
        end,
      }
    })
  })()

  // Step #1: Update the children's positions, and check for new start and end indexes.
  let startIndex = 0, endIndex = children.length, newStartPositionOffset = startPositionOffset
  for (let index = 0, max = children.length; index < max; index++) {
    const child = children[index]
    const { start, end, offset } = metrics[index]
    if (end < -startOuterMargin) {
      startIndex = index + 1
      newStartPositionOffset = startPositionOffset - offset
    }
    if (endIndex === children.length && start > viewHeight + endOuterMargin) {
      endIndex = index
    }
    // Update CSS.
    child.style.top = `${start}px`
  }

  // Step #2: Reduce the list if necessary.
  const shouldReduce = startIndex !== 0 || endIndex !== children.length
  if (shouldReduce) {
    const newNodes = nodes.slice(startIndex, endIndex)
    updateState({ 
      nodes: newNodes, 
      startIndexOffset: startIndexOffset + startIndex,
      startPositionOffset: newStartPositionOffset,
    })
    return // Stop here.
  }

  // Step #3: If no reduce, add new children if necessary.
  const shouldPrepend = metrics[0].start > -startInnerMargin
  if (shouldPrepend) {
    const index = startIndexOffset - 1
    const newNodes = [renderItem(index), ...nodes]
    updateState({
      startIndexOffset: index,
      nodes: newNodes,
      status: 'prepend',
    })
    return // Stop here.
  }
  const shouldAppend = metrics[metrics.length - 1].end < viewHeight + endInnerMargin
  if (shouldAppend) {
    const index = startIndexOffset + nodes.length
    const newNodes = [...nodes, renderItem(index)]
    updateState({ nodes: newNodes })
    return // Stop here.
  }
}

/**
 * "prepend" is a litte more complicated than "append", because after prepend we
 * have to update the `startPositionOffset` property.
 */
const afterPrepend = ({ state, updateState }: Bundle) => {
  const {
    startPositionOffset,
    children,
  } = state
  const height = children[0].offsetHeight
  updateState({
    startPositionOffset: startPositionOffset + height,
    status: 'position-update',
  })
}

export const VirtualScrollList = (props: Props) => {

  // Ref & bundle.
  const ref = useRef<HTMLDivElement>(null)
  const state = useMemo<State>(createState, [])
  const forceUpdate = useForceUpdate({ waitNextFrame: false })
  const updateState = (partialState: Partial<State>) => {
    Object.assign(state, partialState)
    forceUpdate()
  }
  const bundle: Bundle = { props, state, updateState }

  // Core mechanism #1 (update on re-render).
  useEffect(() => {
    const div = ref.current!
    state.children = [...div.children] as HTMLElement[]
    state.viewHeight = div.offsetHeight

    switch (state.status) {
      case 'init': {
        init(bundle)
        break
      }
      case 'init-done': {
        afterInit(bundle)
        break
      }
      case 'prepend': {
        afterPrepend(bundle)
        break
      }
    }
  })

  // Core mechanism #2 (user event subscription, no intermediate updates).
  useComplexEffects(function* () {
    const div = ref.current!
    yield state.position.onChange(() => {
      if (state.status === 'position-update') {
        positionUpdate(bundle)
      }
    })
    yield handleVerticalScroll(div, delta => {
      state.position.increment(delta)
    })
  }, [])

  // Render.
  return (
    <div ref={ref} className='VirtualScrollList'>
      {state.nodes}
    </div>
  )
}
