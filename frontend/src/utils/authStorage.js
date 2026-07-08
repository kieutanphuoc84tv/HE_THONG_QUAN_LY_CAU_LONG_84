const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const REMEMBER_KEY = 'rememberLogin';

function readJson(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function activeStorage() {
  if (localStorage.getItem(TOKEN_KEY) || localStorage.getItem(USER_KEY)) return localStorage;
  if (sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(USER_KEY)) return sessionStorage;
  return localStorage;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(fallback = null) {
  return readJson(localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY), fallback);
}

export function setStoredAuth(token, user, remember) {
  clearStoredAuth();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
}

export function updateStoredUser(user) {
  const storage = activeStorage();
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
    storage.removeItem(REMEMBER_KEY);
  });
}
