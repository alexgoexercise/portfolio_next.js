/**
 * What the room remembers while the browser tab stays open, so leaving for
 * another page and coming back does not reset the game.
 */

export const ROOM_VISITED_KEY = 'alexgosleep.room.visited';
const STATE_KEY = 'alexgosleep.room.state';

export interface RoomState {
  noise: number;
  awake: boolean;
  /** When this was saved, in milliseconds, so the meter can drain for the time away. */
  savedAt: number;
}

export function saveRoomState(state: Omit<RoomState, 'savedAt'>) {
  try {
    window.sessionStorage.setItem(STATE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
    window.sessionStorage.setItem(ROOM_VISITED_KEY, '1');
  } catch {
    // Storage can be blocked (private windows); the game just starts fresh next time
  }
}

export function loadRoomState(): RoomState | null {
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RoomState>;
    if (typeof parsed.noise !== 'number' || typeof parsed.savedAt !== 'number') return null;
    return { noise: parsed.noise, awake: Boolean(parsed.awake), savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}
