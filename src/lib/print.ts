import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'

export async function openPrintableWindow(element: HTMLElement) {
  if (!element) return

  const origin = window.location.origin
  const styles = `
    <meta charset="utf-8" />
    <base href="${origin}/">
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

    // small delay for rendering
    await new Promise(resolve => setTimeout(resolve, 80))

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
  // use html-to-image to get a high fidelity PNG including images
  const imgDataUrl = await toPng(element, { cacheBust: true, quality: 1 })
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  await addImageToPdfPaginated(pdf, imgDataUrl)
  pdf.save(fileName)
}
