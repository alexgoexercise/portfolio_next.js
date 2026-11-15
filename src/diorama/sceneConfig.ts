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

/** The default viewpoint: the same as the "Cam_Hero" camera in room.blend. */
const overview = {
  fov: 28,
  position: [7.6, 6.4, 7.9] as Vec3,
  target: [0, 0.6, -0.1] as Vec3,
};

export const sceneConfig = {
  /** Night sky behind the room. Matches the Blender renders. */
  background: '#0b0f22',

  /** Baked room exported by blender/bake_room.py. */
  roomUrl: '/models/room.glb',

  /**
   * The same two texture sheets as room.glb, but baked with the lights off.
   * Keyed by the name of the baked material they replace. Made by bake_room.py.
   */
  roomNightUrls: {
    baked_shell: '/models/room_night_shell.webp',
    baked_props: '/models/room_night_props.webp',
  },

  /** Slimmed drum kit exported by blender/export_kit.py, already in position. */
  drumKitUrl: '/models/drumkit.glb',

  /** Alex with his skeleton and poses, exported by blender/export_alex.py, already in bed. */
  alexUrl: '/models/alex.glb',

  /**
   * The duvet, draped by a cloth simulation in blender/duvet.py. It carries a
   * second shape, "Awake", pushed down toward the foot of the bed.
   */
  duvetUrl: '/models/duvet.glb',

  /**
   * Timing of waking up and going back to sleep, in seconds. The two moves are
   * taken in turn so the duvet never passes through him: waking, the duvet
   * slides off first and then he sits up; going back to sleep, he lies down
   * first and then the duvet comes back over him.
   */
  motion: {
    duvetSlide: 0.7,
    /** Waking: how long he waits for the duvet to clear before sitting up. */
    sitUpDelay: 0.6,
    /** How long sitting up or lying down takes. */
    sitUp: 0.9,
    /** Going back to sleep: how long the duvet waits for him to lie down. */
    duvetReturnDelay: 0.8,
    /** How far the duvet rises mid-slide, in metres, to clear his hands and toes. */
    duvetLift: 0.07,
  },

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

  /**
   * Lights on while Alex is awake, lights off while he sleeps.
   *
   * The room's two moods are baked textures (see roomNightUrls); the drum kit,
   * Alex and the duvet are lit live, so their lights are faded to match.
   */
  lighting: {
    /** Seconds the lights take to come on or go off. */
    fadeSeconds: 1.1,
    /** Brightness of the lights-off textures. 1 is as baked; raise it to lift the dark room. */
    nightGain: 0.8,
    /**
     * How much of each live light is left with the lights off, as a share of
     * its normal intensity. The lamps and the monitor glow go out completely;
     * moonlight and a little cool fill stay, so the room is dim but not black.
     */
    night: { kitLamp: 0, bedsideLamp: 0, monitors: 0, moon: 1, fill: 1.6, environment: 0.25 },
    /** How much of the PC's glass panels' tint stays in the dark (they would glow against black). */
    nightGlass: 0.15,
    /** Warm glow added to a hovered piece of furniture: strong in the dark, gentle with the lights on. */
    hoverGlow: { night: 0.055, day: 0.02 },
  },

  camera: {
    fov: overview.fov,
    position: overview.position,
    target: overview.target,

    /**
     * How far the visitor can move the camera. "Target" is the point the
     * camera circles around and looks at; sliding it is how you move through
     * the room. Distances are in metres.
     */
    limits: {
      minDistance: 2,
      maxDistance: 22,
      /** Tilt, as an angle from straight down: 0.25 is nearly top-down, 1.5 nearly level. */
      minPolar: 0.25,
      maxPolar: 1.5,
      /** The box the target can be moved within, a little smaller than the room (4.4 m by 3.8 m). */
      target: { min: [-1.8, 0.2, -1.5] as Vec3, max: [1.8, 1.2, 1.5] as Vec3 },
      /** Keyboard movement speed in metres per second (Shift is faster). */
      keyboardSpeed: 1.8,
      /**
       * The two solid walls. From outside either one the camera is kept high
       * enough to see over its top into the room (see CameraRig.tsx). The room
       * is open on its other two sides, so there is no limit there.
       */
      walls: { left: -2.2, back: -1.9, top: 2.4, clearance: 0.15, fadeIn: 0.8 },
      /** Seconds a move to a preset view takes. */
      glideSeconds: 1.4,
    },

    /** Preset viewpoints. The buttons in the room, and the drum kit's card, glide the camera to one. */
    views: {
      overview,
      /**
       * From behind the throne, over the drummer's shoulder, looking at the
       * kit. A wider lens than the overview, so the whole kit fits from close up.
       */
      drummer: { fov: 52, position: [0.2, 1.75, -1.0] as Vec3, target: [1.1, 0.55, 0.7] as Vec3 },
    },
  },
};

export type ViewName = keyof typeof sceneConfig.camera.views;
