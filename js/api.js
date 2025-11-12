const API_BASE = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY  = '514731c2-0c47-4f6b-84a3-3cf6374c3755'; 

function withKey(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${API_BASE}${url}${sep}api_key=${encodeURIComponent(API_KEY)}`;
}

async function apiGet(path) {
  const res = await fetch(withKey(path));
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Ошибка запроса');
  return data;
}

async function apiPost(path, body) {
  const res = await fetch(withKey(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Ошибка создания');
  return data;
}

async function apiPut(path, body) {
  const res = await fetch(withKey(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Ошибка обновления');
  return data;
}

async function apiDelete(path) {
  const res = await fetch(withKey(path), { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Ошибка удаления');
  return data;
}

function showAlert(message, type = 'success') {
  const wrap = document.getElementById('alertArea');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `alert alert-${type} alert-dismissible fade show`;
  el.role = 'alert';
  el.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  wrap.appendChild(el);
  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(el);
    alert.close();
  }, 5000);
}
