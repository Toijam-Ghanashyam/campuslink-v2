import { SceneCanvas, PipelineScene } from './Scenes.jsx';

export default function PipelineCanvas({ visible, progress, labels }) {
  return (
    <SceneCanvas visible={visible} camera={{ position: [-6, 0, 3], fov: 45 }}>
      <PipelineScene progress={progress} labels={labels} />
    </SceneCanvas>
  );
}

