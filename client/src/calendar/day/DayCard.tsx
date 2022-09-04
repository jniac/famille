const days = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
]

const daysBetween = (firstDate: Date, secondDate: Date) => {
  const day = 24 * 60 * 60 * 1000
  const delta = firstDate.getTime() - secondDate.getTime()
  return Math.round(delta / day)
}

const deltaDayToWord = (deltaDay: number) => {
  switch (deltaDay) {
    case -2: return 'Avant-hier'
    case -1: return 'Hier'
    case 0: return `Aujourd'hui`
    case 1: return 'Demain'
    case 2: return 'Après-demain'
    default: return deltaDay < 0 ? `Il y a ${-deltaDay} jours` : `Dans ${deltaDay} jours`
  }
}

export const DayCard = ({
  date = new Date(),
}) => {
  return (
    <div className='flex column center'>
      <div>{deltaDayToWord(daysBetween(date, new Date()))}</div>
      <div>{days[date.getDay()]}</div>
      {date.toLocaleDateString()}
    </div>
  )
}
