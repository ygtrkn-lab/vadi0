import { jsPDF } from 'jspdf'
import { toPng, toJpeg } from 'html-to-image'

export async function preparePrintableElement(el: HTMLElement, doc?: Document, win?: Window) {
  const docToUse = doc || document
  const winToUse = win || window

  // Wait for fonts in the provided document if possible
  try {
    if ((docToUse as any).fonts && (docToUse as any).fonts.ready) await Promise.race([ (docToUse as any).fonts.ready, new Promise<void>((r) => setTimeout(r, 300)) ])
  } catch (e) {}

  // If the element is not attached to the target document or is hidden, clone it into a visible off-screen wrapper in that document
  let target: HTMLElement = el
  let tempWrapper: HTMLElement | null = null
  try {
    const needsClone = el.ownerDocument !== docToUse || el.offsetWidth === 0 || el.offsetHeight === 0
    if (needsClone) {
      tempWrapper = docToUse.createElement('div')
      tempWrapper.style.position = 'fixed'
      tempWrapper.style.left = '-9999px'
      tempWrapper.style.top = '0'
      tempWrapper.style.width = 'auto'
      tempWrapper.style.height = 'auto'
      tempWrapper.style.overflow = 'visible'
      tempWrapper.style.visibility = 'visible'
      tempWrapper.style.zIndex = '2147483647'
      docToUse.body.appendChild(tempWrapper)
      const cloned = el.cloneNode(true) as HTMLElement
      tempWrapper.appendChild(cloned)
      target = cloned
    }
  } catch (e) {
    target = el
    tempWrapper = null
  }

  const overlays: HTMLElement[] = []

  try {
    const cert = target.querySelector('[data-certificate]') as HTMLElement | null
    if (cert) {
      const recipient = target.querySelector('[data-recipient-field]') as HTMLElement | null
      const sender = target.querySelector('[data-sender-field]') as HTMLElement | null
      if (recipient && (!recipient.textContent || !recipient.textContent.trim())) recipient.textContent = cert.dataset.recipientName || '—'
      if (sender && (!sender.textContent || !sender.textContent.trim())) sender.textContent = cert.dataset.senderName || '—'

      const createOverlay = (fieldEl: HTMLElement | null, text: string | undefined) => {
        if (!fieldEl) return
        const txt = (text || '').trim()
        if (fieldEl.textContent && fieldEl.textContent.trim()) return
        if (!txt) return
        try {
          const elRect = target.getBoundingClientRect()
          const fRect = fieldEl.getBoundingClientRect()
          const ov = docToUse.createElement('div')
          ov.className = 'pdf-name-overlay'
          ov.textContent = txt
          ov.style.position = 'absolute'
          ov.style.left = (fRect.left - elRect.left) + 'px'
          ov.style.top = (fRect.top - elRect.top) + 'px'
          ov.style.width = (fRect.width) + 'px'
          ov.style.height = (fRect.height) + 'px'
          ov.style.overflow = 'hidden'
          ov.style.whiteSpace = 'nowrap'
          ov.style.textOverflow = 'ellipsis'
          const comp = (winToUse.getComputedStyle && winToUse.getComputedStyle(fieldEl)) || (window.getComputedStyle && window.getComputedStyle(fieldEl))
          ov.style.fontFamily = comp?.fontFamily || 'sans-serif'
          ov.style.fontSize = comp?.fontSize || '10px'
          ov.style.lineHeight = comp?.lineHeight || '16px'
          ov.style.color = comp?.color || '#111827'
          ov.style.display = 'block'
          ov.style.pointerEvents = 'none'
          target.appendChild(ov)
          overlays.push(ov)
        } catch (e) {
          // ignore overlay failures
        }
      }

      createOverlay(recipient, cert.dataset.recipientName)
      createOverlay(sender, cert.dataset.senderName)

      // Adjust QR svg size to fill its container better
      try {
        const qr = target.querySelector('[data-qr]') as HTMLElement | null
        if (qr) {
          const svg = qr.querySelector('svg') as SVGElement | null
          if (svg) {
            const style = (winToUse.getComputedStyle && winToUse.getComputedStyle(qr as Element)) || undefined
            const pad = style ? (parseFloat(style.paddingTop || '4') || 4) : 4
            const inner = Math.floor((qr.clientWidth || 110) - pad * 2)
            svg.setAttribute('width', String(Math.max(72, inner)))
            svg.setAttribute('height', String(Math.max(72, inner)))
          }
        }
      } catch (e) {}

      // Shrink gift message to fit inside certificate
      try {
        const gift = target.querySelector('[data-gift-message]') as HTMLElement | null
        if (gift) {
          const compute = () => gift.scrollHeight > gift.clientHeight
          let fs = parseFloat(winToUse.getComputedStyle(gift).fontSize || '10')
          while (compute() && fs > 8) {
            fs = Math.max(8, fs - 0.5)
            gift.style.fontSize = fs + 'px'
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  return { overlays, tempWrapper, target }
}

export async function openPrintableWindow(element: HTMLElement) {
  if (!element) return

  const origin = window.location.origin
  const styles = `
    <meta charset="utf-8" />
    <base href="${origin}/">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      @font-face { font-family: 'Geraldine'; src: url('/geraldine-personal-use/GERALDINE PERSONAL USE.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
      @font-face { font-family: 'TheMunday'; src: url('/geraldine-personal-use/Themundayfreeversion-Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
    </style>
    <style>
      @page { size: A4; margin: 12mm }
      body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin: 0; padding: 12mm; color: #111827 }
      img { max-width: 100%; height: auto }
    </style>
  `

  // preparePrintableElement moved to module scope

  // Helper to write content and print in a given document context
  const writeAndPrint = async (doc: Document | null, win: Window | null) => {
    if (!doc || !win) throw new Error('Invalid doc/window')
    doc.open()
    doc.write(`<!doctype html><html><head>${styles}</head><body></body></html>`)
    doc.close()

    const clone = element.cloneNode(true) as HTMLElement
    // Make relative images absolute and set crossorigin
    const imgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[]
    imgs.forEach(img => {
      try {
        const srcAttr = img.getAttribute('src') || ''
        if (srcAttr.startsWith('/')) img.src = origin + srcAttr
        if (!img.getAttribute('crossOrigin')) img.setAttribute('crossOrigin', 'anonymous')
      } catch (e) {}
    })

    doc.body.appendChild(clone)

    // Prepare cloned content for printing (populate names, overlays, QR sizing, shrink-to-fit)
    try { await preparePrintableElement(clone, doc, win) } catch (e) { /* ignore */ }

    // Wait for images to load (or timeout)
    const imagesInDoc = Array.from(doc.images) as HTMLImageElement[]
    await Promise.race([
      new Promise<void>((resolve) => {
        if (imagesInDoc.length === 0) return resolve()
        let remaining = imagesInDoc.length
        const onLoadOrError = () => {
          remaining -= 1
          if (remaining <= 0) resolve()
        }
        imagesInDoc.forEach(img => {
          if (img.complete) onLoadOrError()
          else {
            img.addEventListener('load', onLoadOrError)
            img.addEventListener('error', onLoadOrError)
          }
        })
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 3000))
    ])

    // Wait for fonts to be available in this document (prevents layout shift)
    try {
      // doc.fonts might be undefined in some contexts; guard for it
      if ((doc as any).fonts && (doc as any).fonts.ready) {
        await Promise.race([ (doc as any).fonts.ready, new Promise<void>((r) => setTimeout(r, 250)) ])
      }
    } catch (e) {
      // ignore
    }

    // small delay for rendering
    await new Promise(resolve => setTimeout(resolve, 120))

    // Shrink gift message if it would overflow the certificate area
    try {
      const gift = (clone.querySelector('[data-gift-message]') as HTMLElement | null)
      if (gift) {
        const compute = () => gift.scrollHeight > gift.clientHeight
        let fs = parseFloat(win.getComputedStyle(gift).fontSize || '10')
        while (compute() && fs > 8) {
          fs = Math.max(8, fs - 0.5)
          gift.style.fontSize = fs + 'px'
        }
      }
    } catch (e) {
      /* ignore */
    }

    win.focus()
    win.print()
  }

  // Preferred: use an off-screen iframe (same-tab) so pop-up blockers are not triggered
  try {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '-9999px'
    iframe.setAttribute('aria-hidden', 'true')
    document.body.appendChild(iframe)

    const iframeWin = iframe.contentWindow
    const iframeDoc = iframe.contentDocument
    if (!iframeWin || !iframeDoc) throw new Error('Iframe not available')

    await writeAndPrint(iframeDoc, iframeWin)

    // remove iframe after short delay
    setTimeout(() => {
      try { document.body.removeChild(iframe) } catch (e) {}
    }, 500)

    return
  } catch (err) {
    console.warn('Iframe print failed, falling back to opening a new window', err)
  }

  // Final fallback: try to open a new window (may be blocked by popup blockers)
  try {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (printWindow) {
      await writeAndPrint(printWindow.document, printWindow)
      return
    }
  } catch (err) {
    console.error('Popup fallback also failed', err)
  }

  alert('Yazdırma başarısız oldu. Lütfen tarayıcı ayarlarınızı kontrol edin veya PDF indir seçeneğini kullanın.')
}

// Slices a large image into page-sized chunks and adds to PDF
async function addImageToPdfPaginated(pdf: any, imgDataUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const imgW = img.width
      const imgH = img.height

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      // scale to fit width
      const ratio = pageW / imgW
      const renderedH = imgH * ratio

      // Number of pages
      const pages = Math.ceil(renderedH / pageH)

      // Create offscreen canvas to slice
      const sliceCanvas = document.createElement('canvas')
      const sliceCtx = sliceCanvas.getContext('2d')!

      // working in px for canvas; compute slice height in original px
      const sliceHeightPx = Math.floor(pageH / ratio)

      for (let i = 0; i < pages; i++) {
        const sy = i * sliceHeightPx
        const sh = Math.min(sliceHeightPx, imgH - sy)
        sliceCanvas.width = imgW
        sliceCanvas.height = sh
        sliceCtx.clearRect(0, 0, imgW, sh)
        sliceCtx.drawImage(img, 0, sy, imgW, sh, 0, 0, imgW, sh)
        const sliceData = sliceCanvas.toDataURL('image/png')
        const h = sh * ratio
        if (i > 0) pdf.addPage()
        pdf.addImage(sliceData, 'PNG', 0, 0, pageW, h)
      }

      resolve()
    }
    img.onerror = (e) => reject(new Error('Failed to load generated image for PDF'))
    img.src = imgDataUrl
  })
}

export async function downloadPdfClientSide(element: HTMLElement, fileName = 'order.pdf') {
  if (!element) return
  // Ensure Cinzel Decorative is loaded on the document so rendered text uses it in PNG/PDF
  try {
    if (!document.querySelector('link[href*="Montserrat"]') && !document.querySelector('link[href*="Roboto"]')) {
      const l1 = document.createElement('link')
      l1.rel = 'preconnect'
      l1.href = 'https://fonts.googleapis.com'
      document.head.appendChild(l1)

      const l2 = document.createElement('link')
      l2.rel = 'preconnect'
      l2.href = 'https://fonts.gstatic.com'
      l2.crossOrigin = 'anonymous'
      document.head.appendChild(l2)

      const ls = document.createElement('link')
      ls.rel = 'stylesheet'
      ls.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap'
      document.head.appendChild(ls)
    }
  } catch (e) {
    /* ignore */
  }

  // Wait for local fonts to be ready to avoid layout shifts
  try {
    if (document.fonts && document.fonts.ready) await Promise.race([ document.fonts.ready, new Promise<void>((r) => setTimeout(r, 500)) ])
  } catch (e) {}

  // Ensure KİME/KİMDEN and QR/fit adjustments are applied via the shared preparer
  let overlays: HTMLElement[] = []
  let target: HTMLElement = element
  let tempWrapper: HTMLElement | null = null
  try {
    const res = await preparePrintableElement(element, document, window)
    overlays = res.overlays
    target = res.target
    tempWrapper = res.tempWrapper
  } catch (e) {
    // ignore preparation failures
  }

  // Make relative images absolute and set crossorigin on the target to avoid CORS/relative-url issues
  try {
    const imgs = Array.from(target.querySelectorAll('img')) as HTMLImageElement[]
    imgs.forEach(img => {
      try {
        const srcAttr = img.getAttribute('src') || ''
        if (srcAttr.startsWith('/')) img.src = window.location.origin + srcAttr
        if (!img.getAttribute('crossOrigin')) img.setAttribute('crossOrigin', 'anonymous')
      } catch (e) {}
    })
  } catch (e) {}

  // use html-to-image to get a high fidelity PNG including images (render at higher pixel ratio for quality)
  let imgDataUrl = await toPng(target, { cacheBust: true, quality: 1, pixelRatio: Math.max(2, window.devicePixelRatio || 2), backgroundColor: '#ffffff' })

  // If PNG is too large, fallback to JPEG with compression to reduce file size
  try {
    const approxSizeMb = (imgDataUrl.length * (3/4)) / (1024*1024)
    if (approxSizeMb > 1.5) {
      // try a JPEG at lower pixel ratio/quality
      imgDataUrl = await toJpeg(element, { quality: 0.8, pixelRatio: Math.max(1.25, (window.devicePixelRatio || 2)), backgroundColor: '#ffffff' })
    }
  } catch (e) {
    // ignore and use png
  }

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  await addImageToPdfPaginated(pdf, imgDataUrl)
  pdf.save(fileName)

  // cleanup overlays if any were added and remove temporary wrapper if used
  try {
    overlays.forEach(o => { try { o.parentElement?.removeChild(o) } catch (e) {} })
    if (tempWrapper) try { document.body.removeChild(tempWrapper) } catch (e) {}
  } catch (e) {}
}
