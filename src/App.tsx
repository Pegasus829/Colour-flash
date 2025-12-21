import { GameProvider, useGame } from './contexts/GameContext';
import {
  WelcomeScreen,
  InstructionsScreen,
  HomeScreen,
  GameScreen,
  GameOverScreen,
  ProfileScreen,
} from './components';

function GameRouter() {
  const { screen } = useGame();

  switch (screen) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'instructions':
      return <InstructionsScreen />;
    case 'home':
      return <HomeScreen />;
    case 'playing':
      return <GameScreen />;
    case 'gameOver':
      return <GameOverScreen />;
    case 'profile':
      return <ProfileScreen />;
    default:
      return <WelcomeScreen />;
  }
}

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
