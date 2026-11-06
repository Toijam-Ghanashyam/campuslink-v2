import { SceneCanvas, HeroScene } from './Scenes.jsx';

export default function HeroCanvas({ visible }) {
  return (
    <SceneCanvas visible={visible} camera={{ position: [0, 0, 8], fov: 50 }}>
      <HeroScene />
    </SceneCanvas>
  );
}

