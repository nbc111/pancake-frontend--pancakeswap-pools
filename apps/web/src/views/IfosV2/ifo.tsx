import { IfoV2Provider } from './contexts/IfoV2Provider'
import CurrentIfo from './CurrentIfo'

const Ifo = () => {
  return (
    <IfoV2Provider>
      <CurrentIfo />
    </IfoV2Provider>
  )
}

export default Ifo
