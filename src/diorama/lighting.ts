import * as THREE from 'three';

/**
 * The room has two moods: lights off while Alex sleeps, lights on once he
 * wakes. Both are baked in Blender (blender/bake_room.py) into texture sheets
 * with the same layout, and this file fades between them.
 */

/** 0 = lights off, 1 = lights on. One number shared by everything that reacts to the lights. */
export const litUniform = { value: 0 };

/** Brightness multiplier on the lights-off sheets (see sceneConfig.lighting.nightGain). */
export const nightGainUniform = { value: 1 };

/** The lights-off texture for each baked material, filled in once the textures have loaded. */
const nightMaps = new Map<string, { value: THREE.Texture | null }>();

export function nightMapFor(sheet: string) {
  let slot = nightMaps.get(sheet);
  if (!slot) {
    slot = { value: null };
    nightMaps.set(sheet, slot);
  }
  return slot;
}

/** Gives a loaded lights-off texture the same settings the glTF loader gives the lit one. */
export function registerNightMap(sheet: string, texture: THREE.Texture) {
  texture.flipY = false; // glTF images are stored the other way up
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  nightMapFor(sheet).value = texture;
}

/**
 * Makes a baked material show the lights-off picture when the room is dark,
 * the lit picture when it is lit, and a blend of the two in between. Both
 * pictures share one set of UV coordinates, so the same lookup works for both.
 */
export function mixWithNight(material: THREE.MeshBasicMaterial, sheet: string) {
  const night = nightMapFor(sheet);
  // How much warm glow this piece of furniture has on top of its picture. Raised
  // while the pointer is over it: multiplying a near-black object brighter
  // changes nothing, so a hovered PC in the dark needs a glow added instead.
  const glow = { value: 0 };
  material.userData.glow = glow;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNightMap = night;
    shader.uniforms.uLit = litUniform;
    shader.uniforms.uNightGain = nightGainUniform;
    shader.uniforms.uGlow = glow;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        'uniform sampler2D uNightMap;\nuniform float uLit;\nuniform float uNightGain;\nuniform float uGlow;\nvoid main() {'
      )
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        #ifdef USE_MAP
          vec4 litTexel = texture2D( map, vMapUv );
          vec4 darkTexel = texture2D( uNightMap, vMapUv ) * uNightGain;
          diffuseColor *= mix( darkTexel, litTexel, uLit );
          diffuseColor.rgb += uGlow * vec3( 1.0, 0.7, 0.4 );
        #endif`
      );
  };
  // Every room material runs the same patched program, so share one compiled copy
  material.customProgramCacheKey = () => 'room-lit-or-dark';
}

/** Eases a 0 to 1 value, so lights swell on and off instead of ramping linearly. */
export function ease(t: number) {
  return t * t * (3 - 2 * t);
}

/** Moves `current` toward `target` by at most `step`. */
export function approach(current: number, target: number, step: number) {
  return current < target ? Math.min(target, current + step) : Math.max(target, current - step);
}
