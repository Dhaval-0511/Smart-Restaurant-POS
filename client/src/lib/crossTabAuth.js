/**
 * crossTabAuth.js — Cross-tab session synchronization
 *
 * Uses BroadcastChannel to keep all browser tabs in the same window
 * synchronized to a single logged-in user. When any tab logs in or
 * logs out, every other open tab reacts immediately.
 *
 * Also listens to the native 'storage' event as a fallback for browsers
 * where BroadcastChannel is unavailable.
 */

const CHANNEL_NAME = 'cafe_auth_channel';

/**
 * Setup cross-tab synchronization.
 * Call this once from App.jsx after the Zustand store is ready.
 *
 * @param {object} store - The Zustand store instance (useStore.getState())
 * @param {function} navigate - React Router's navigate function
 * @returns {function} cleanup — call on unmount
 */
export function setupCrossTabSync(getStoreState, navigate) {
  let channel = null;

  // ── BroadcastChannel (all modern browsers) ───────────────────────────────
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event) => {
      const { type, userId, role, token, sessionId } = event.data || {};
      const store = getStoreState();

      if (type === 'AUTH_LOGIN') {
        // Another tab logged in — sync this tab if it's a different user or not yet logged in
        const myUserId = store.currentUserId;
        if (myUserId && myUserId !== userId) {
          // A different user just logged in in another tab — log this tab out silently
          store.logout();
          navigate('/login', { replace: true });
        } else if (!myUserId && token) {
          // This tab had no user — sync to the newly logged-in user
          // Store the token so API calls work, then reload to fully bootstrap
          try { localStorage.setItem('cafe-auth-token', JSON.stringify(token)); } catch (e) {}
          if (sessionId) { try { localStorage.setItem('cafe-session-id', sessionId); } catch (e) {} }
          // Reload triggers App.jsx bootstrap and routes to the right dashboard
          window.location.reload();
        }
      }

      if (type === 'AUTH_LOGOUT') {
        // Another tab logged out — log this tab out too
        const myUserId = store.currentUserId;
        if (myUserId) {
          store.logout();
          navigate('/login', { replace: true });
        }
      }
    };
  } catch (e) {
    // BroadcastChannel not available (very old browsers) — fall through to storage event
  }

  // ── Storage event fallback (fires in all tabs EXCEPT the one that wrote) ──
  const handleStorageChange = (event) => {
    if (event.key === 'cafe-auth-token') {
      const store = getStoreState();
      if (event.newValue === null && store.currentUserId) {
        // Token was removed in another tab → log out this tab
        store.logout();
        navigate('/login', { replace: true });
      }
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  return () => {
    if (channel) channel.close();
    window.removeEventListener('storage', handleStorageChange);
  };
}

