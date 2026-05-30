import { GameProvider, useGame } from './core/GameContext'
import StoryScreen from './components/screens/StoryScreen'
import MainGameScreen from './components/screens/MainGameScreen'
import GameOverlay from './components/screens/GameOverlay'

function GameRouter() {
  const { state } = useGame()
  const { gamePhase, pendingBankruptcyStory } = state

  if (gamePhase === 'story') return <StoryScreen />
  if (gamePhase === 'playing') {
    return (
      <>
        <MainGameScreen />
        {pendingBankruptcyStory && <GameOverlay />}
      </>
    )
  }
  if (gamePhase === 'game_over' || gamePhase === 'victory') {
    return (
      <>
        <MainGameScreen />
        <GameOverlay />
      </>
    )
  }

  return <StoryScreen />
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  )
}
