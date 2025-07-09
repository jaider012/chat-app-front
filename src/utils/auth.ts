export const getTokenFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

export const clearTokenFromUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('token');
  window.history.replaceState({}, document.title, url.toString());
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};