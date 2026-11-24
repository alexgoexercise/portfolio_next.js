/**
 * What the 3D folder and the page's HTML share. The text lives in ordinary
 * HTML (so it can be selected and clicked); every frame the folder in the
 * scene writes a CSS 3D transform onto these so the text sits exactly on it.
 */
export interface StageDom {
  container: HTMLElement | null;
  camera: HTMLElement | null;
  rig: HTMLElement | null;
  up: boolean;
  tabCount: number;
  activeTab: number;
}

/** The floating folder on the About page. */
export const paperDom: StageDom = {
  /** Full-screen layer that carries the perspective. */
  container: null,
  /** Child of the container, positioned like the camera. */
  camera: null,
  /** The folder's HTML: tabs, the paper's text, and the controls on its front. */
  rig: null,
  /** Whether the page wants its sheet drawn up out of the folder (false while it swaps sheets). */
  up: true,
  /** How many tabs the folder has, and which one is lit. */
  tabCount: 0,
  activeTab: 0,
};

/** The floating phone on the Contacts page. */
export const phoneDom: StageDom = {
  container: null,
  camera: null,
  rig: null,
  up: true,
  tabCount: 0,
  activeTab: 0,
};
