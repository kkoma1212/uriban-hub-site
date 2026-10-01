fetch('app-entry.json', { cache: 'no-store' }).then(response => {
  if (!response.ok) throw new Error('Entry information unavailable')
  return response.json()
}).then(entry => {
  const url = new URL(entry.url)
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname)) return
  document.querySelector('#app-link').href = `${url.origin}/login`
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.updated_on)) document.querySelector('#entry-status').textContent = `현재 체험 주소 · ${entry.updated_on.replaceAll('-', '. ')} 갱신`
}).catch(() => { /* The verified HTML link remains usable if loading the update fails. */ })
