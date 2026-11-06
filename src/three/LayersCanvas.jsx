import { SceneCanvas, LayersScene } from './Scenes.jsx';

export default function LayersCanvas({ visible, spread, labels }) {
  return (
    <SceneCanvas visible={visible} camera={{ position: [5, 3.2, 7], fov: 40 }}>
      <LayersScene spread={spread} labels={labels} />
    </SceneCanvas>
  );
}
