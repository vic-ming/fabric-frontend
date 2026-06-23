const USE_REAL_API = false;

export async function login(credentials) {
  if (USE_REAL_API) {
    const body = new URLSearchParams(credentials);
    const response = await fetch('/Home/Login', { method: 'POST', body });
    if (!response.ok) throw new Error('登入失敗');
  }

  await delay(350);
  return { userId: credentials.id || '2605' };
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
