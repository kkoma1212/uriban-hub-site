fetch('app-entry.json', { cache: 'no-store' }).then(response => {
  if (!response.ok) throw new Error('Entry information unavailable')
  return response.json()
}).then(entry => {
  const url = new URL(entry.url)
  if (url.protocol !== 'https:' || !/^(?:[a-z0-9-]+\.trycloudflare\.com|lexi-entry\.kkoma1212\.workers\.dev)$/.test(url.hostname)) return
  document.querySelector('#app-link').href = `${url.origin}/login`
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.updated_on)) document.querySelector('#entry-status').textContent = `LEXI 접속 주소 · ${entry.updated_on.replaceAll('-', '. ')} 확인`
}).catch(() => { /* The verified HTML link remains usable if loading the update fails. */ })
