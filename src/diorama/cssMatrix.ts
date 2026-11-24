import * as THREE from 'three';
import { sceneConfig } from './sceneConfig';

const K = sceneConfig.paper.pxPerMetre;

/** CSS 3D matrix strings, the same maths three.js's CSS3DRenderer uses. 1 metre is K CSS pixels. */
export function cameraCss(m: THREE.Matrix4) {
  const e = m.elements;
  return `matrix3d(${e[0]},${-e[1]},${e[2]},${e[3]},${e[4]},${-e[5]},${e[6]},${e[7]},${e[8]},${-e[9]},${e[10]},${e[11]},${e[12] * K},${-e[13] * K},${e[14] * K},${e[15]})`;
}

export function objectCss(m: THREE.Matrix4) {
  const e = m.elements;
  return `translate(-50%,-50%) matrix3d(${e[0]},${e[1]},${e[2]},${e[3]},${-e[4]},${-e[5]},${-e[6]},${-e[7]},${e[8]},${e[9]},${e[10]},${e[11]},${e[12] * K},${e[13] * K},${e[14] * K},${e[15]})`;
}
