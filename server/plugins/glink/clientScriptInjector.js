let injectedGaId = null

export function injectClientScripts(plugin, { includeAdmin = false } = {}) {
  const head = document.head
  let currentGaId = null

  const removeExisting = () => {
    document.querySelectorAll('script[data-glink-ga-loader], script[data-glink-ga-inline]').forEach(el => el.remove())
  }

  const { gaId, headSnippet, testing, trackAdmin } = plugin.settings || {}
  if (!includeAdmin && trackAdmin === false && window.location.pathname.startsWith('/admin')) {
    return null
  }
  currentGaId = gaId || null
  if (currentGaId && injectedGaId && injectedGaId !== currentGaId) {
    removeExisting()
  }
  if (!currentGaId) {
    removeExisting()
    injectedGaId = null
  }
  if (gaId) {
    const existingLoader = document.querySelector(`script[data-glink-ga-loader="${gaId}"]`)
    if (!existingLoader) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      script.setAttribute('data-glink-ga-loader', gaId)
      head.appendChild(script)
    }
    const existingInline = document.querySelector(`script[data-glink-ga-inline="${gaId}"]`)
    if (!existingInline) {
      const inline = document.createElement('script')
      inline.setAttribute('data-glink-ga-inline', gaId)
      inline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}', ${testing ? "{cookie_domain:'none'}" : '{}'});
      `
      head.appendChild(inline)
    }
    injectedGaId = gaId
  }
  if (headSnippet) {
    const existingSnippet = document.querySelector('script[data-glink-head-snippet="1"]')
    if (!existingSnippet) {
      const snippet = document.createElement('script')
      snippet.setAttribute('data-glink-head-snippet', '1')
      snippet.innerHTML = headSnippet
      head.appendChild(snippet)
    }
  }
  return !!currentGaId
}

export default injectClientScripts