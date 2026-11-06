import * as THREE from 'three';

export const THREAD_POINTS = [
  [-6, -1, 0],
  [-3.5, 1.2, -1.5],
  [-1, -0.6, -3],
  [1.5, 1.4, -4.5],
  [3.5, -0.4, -6],
  [5.5, 1, -8],
  [7, -0.8, -10],
].map((p) => new THREE.Vector3(...p));

export const threadCurve = new THREE.CatmullRomCurve3(
  THREAD_POINTS,
  false,
  'catmullrom',
  0.5
);

