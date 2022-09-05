
import { Calendar } from 'calendar'
import { VirtualScrollList } from 'calendar/utils/VirtualScrollList'
import { useEffect } from 'react'
import './App.css'



const Item = ({ index = 0 }) => {
  useEffect(() => {
    console.log(`item(${index}) mount`)
    return () => {
      console.log(`item(${index}) unmount!!!`)
    }
  }, [])
  const height = (index % 5 === 0 ? 1 : Math.abs(index) + 1) * 2
  return (
    <div
      className='flex column center'
      style={{
        backgroundColor: index % 2 ? '#fc0' : 'white',
        padding: '4px',
        height: `${height}em`,
      }}>
      item ({index})
    </div>
  )
}

export const App = () => {
  return (
    <div className='App absolute-fill flex column center'>
      {/* <Calendar /> */}

      <h1>VirtualScrollList test</h1>
      <VirtualScrollList
        renderItem={index => <Item key={index} index={index} />}
      />
    </div>
  )
}
