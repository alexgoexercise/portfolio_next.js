/**
 * What the 3D folder and the page's HTML share. The text lives in ordinary
 * HTML (so it can be selected and clicked); every frame the folder in the
 * scene writes a CSS 3D transform onto these so the text sits exactly on it.
 */
export const paperDom = {
  /** Full-screen layer that carries the perspective. */
  container: null as HTMLElement | null,
  /** Child of the container, positioned like the camera. */
  camera: null as HTMLElement | null,
  /** The folder's HTML: tabs, the paper's text, and the controls on its front. */
  rig: null as HTMLElement | null,
  /** Whether the page wants its sheet drawn up out of the folder (false while it swaps sheets). */
  up: true,
  /** How many tabs the folder has, and which one is lit. */
  tabCount: 0,
  activeTab: 0,
};
