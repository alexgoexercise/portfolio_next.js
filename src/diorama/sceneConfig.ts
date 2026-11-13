/**
 * Settings for the diorama page.
 *
 * The room itself is modelled, lit and baked in Blender (see /blender), so the
 * only things decided here are how the browser frames it.
 *
 * Three.js axes: +x right, +y up, +z toward the viewer. The room is centred on
 * the origin with its floor at y = 0; the back wall is at -z, the left wall at -x.
 */

export type Vec3 = [number, number, number];

export const sceneConfig = {
  /** Night sky behind the room. Matches the Blender renders. */
  background: '#0b0f22',

  /** Baked room exported by blender/bake_room.py. */
  roomUrl: '/models/room.glb',

  /** Slimmed drum kit exported by blender/export_kit.py, already in position. */
  drumKitUrl: '/models/drumkit.glb',

  /** Alex with his skeleton and poses, exported by blender/export_alex.py, already in bed. */
  alexUrl: '/models/alex.glb',

  /** Folder in /public holding three.js's decoder for compressed models. */
  dracoPath: '/draco/',

  /**
   * Lights for the pieces that are not baked (the drum kit, and later Alex).
   * They stand where the lamps are in room.blend so those pieces pick up the
   * same glow as the baked room around them. The room itself ignores them.
   */
  lights: {
    kitLamp: { position: [1.2, 2.35, 0.9] as Vec3, color: '#ffc890', intensity: 14 },
    bedsideLamp: { position: [-0.88, 0.75, -1.73] as Vec3, color: '#ff9a4d', intensity: 5 },
    monitors: { position: [1.0, 1.1, -1.2] as Vec3, color: '#9fc4ff', intensity: 2 },
    moon: { position: [-4, 3, 0.5] as Vec3, color: '#9db8ff', intensity: 0.6 },
    fill: { color: '#2a2f55', intensity: 0.5 },
  },

  camera: {
    fov: 28,
    /** Same viewpoint as the "Cam_Hero" camera in room.blend. */
    position: [7.6, 6.4, 7.9] as Vec3,
    target: [0, 0.6, -0.1] as Vec3,
  },
};
