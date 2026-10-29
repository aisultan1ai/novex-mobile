import { create } from 'zustand';

export type SessionStatus = 'unknown' | 'signedIn' | 'signedOut';

interface SessionState {
  status: SessionStatus;
  setStatus: (status: SessionStatus) => void;
}

// Данные профиля сюда не кладём — они приходят с сервера через react-query.
export const useSessionStore = create<SessionState>()((set) => ({
  status: 'unknown',
  setStatus: (status) => set({ status }),
}));
