import { jsPDF } from 'jspdf'
import { toPng, toJpeg } from 'html-to-image'

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

    // --- Prepare cloned content: ensure recipient/sender fields and adjust QR size in the clone ---
    try {
      const cert = clone.querySelector('[data-certificate]') as HTMLElement | null
      if (cert) {
        const recipient = clone.querySelector('[data-recipient-field]') as HTMLElement | null
        const sender = clone.querySelector('[data-sender-field]') as HTMLElement | null
        if (recipient && (!recipient.textContent || !recipient.textContent.trim())) recipient.textContent = cert.dataset.recipientName || '—'
        if (sender && (!sender.textContent || !sender.textContent.trim())) sender.textContent = cert.dataset.senderName || '—'
      }

      // Adjust QR svg size to fill its container better (in the cloned document)
      const qr = clone.querySelector('[data-qr]') as HTMLElement | null
      if (qr) {
        const svg = qr.querySelector('svg') as SVGElement | null
        if (svg) {
          // measure padding and inner size
          const style = win.getComputedStyle ? win.getComputedStyle(qr as Element) : undefined
          const pad = style ? (parseFloat(style.paddingTop || '4') || 4) : 4
          const inner = Math.floor((qr.clientWidth || 110) - pad * 2)
          svg.setAttribute('width', String(Math.max(72, inner)))
          svg.setAttribute('height', String(Math.max(72, inner)))
        }
      }
    } catch (e) {
      // ignore preparation errors and proceed
    }

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

  // Ensure KİME/KİMDEN fields are populated — some hidden templates may miss values when exported
  const overlays: HTMLElement[] = []
  try {
    const cert = element.querySelector('[data-certificate]') as HTMLElement | null
    if (cert) {
      const recipient = element.querySelector('[data-recipient-field]') as HTMLElement | null
      const sender = element.querySelector('[data-sender-field]') as HTMLElement | null
      // If fields are empty, use dataset fallbacks set on the certificate root
      if (recipient && (!recipient.textContent || !recipient.textContent.trim())) recipient.textContent = cert.dataset.recipientName || '—'
      if (sender && (!sender.textContent || !sender.textContent.trim())) sender.textContent = cert.dataset.senderName || '—'

      // Make a fail-safe overlay if a field is still empty after DOM writes (some rendering paths strip text)
      const createOverlay = (fieldEl: HTMLElement | null, text: string | undefined) => {
        if (!fieldEl) return
        const txt = (text || '').trim()
        if (fieldEl.textContent && fieldEl.textContent.trim()) return
        if (!txt) return
        try {
          const elRect = element.getBoundingClientRect()
          const fRect = fieldEl.getBoundingClientRect()
          const ov = document.createElement('div')
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
          ov.style.fontFamily = window.getComputedStyle(fieldEl).fontFamily || 'sans-serif'
          ov.style.fontSize = window.getComputedStyle(fieldEl).fontSize || '10px'
          ov.style.lineHeight = window.getComputedStyle(fieldEl).lineHeight || '16px'
          ov.style.color = window.getComputedStyle(fieldEl).color || '#111827'
          ov.style.display = 'block'
          ov.style.pointerEvents = 'none'
          element.appendChild(ov)
          overlays.push(ov)
        } catch (e) {
          // ignore overlay failures
        }
      }

      createOverlay(recipient, cert.dataset.recipientName)
      createOverlay(sender, cert.dataset.senderName)

      // Shrink gift message to fit inside certificate before rendering PNG
      const gift = element.querySelector('[data-gift-message]') as HTMLElement | null
      if (gift) {
        const compute = () => gift.scrollHeight > gift.clientHeight
        let fs = parseFloat(window.getComputedStyle(gift).fontSize || '10')
        while (compute() && fs > 8) {
          fs = Math.max(8, fs - 0.5)
          gift.style.fontSize = fs + 'px'
        }
      }
    }
  } catch (e) {}

  // use html-to-image to get a high fidelity PNG including images (render at higher pixel ratio for quality)
  let imgDataUrl = await toPng(element, { cacheBust: true, quality: 1, pixelRatio: Math.max(2, window.devicePixelRatio || 2), backgroundColor: '#ffffff' })

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

  // cleanup overlays if any were added
  try {
    overlays.forEach(o => { try { element.removeChild(o) } catch (e) {} })
  } catch (e) {}
}
