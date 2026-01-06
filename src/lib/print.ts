import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'

export async function openPrintableWindow(element: HTMLElement) {
  if (!element) return

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    alert('Yeni pencere açılmadı. Tarayıcı pop-up engelleyicisini kontrol edin.');
    return
  }

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

  printWindow.document.open()
  printWindow.document.write(`<!doctype html><html><head>${styles}</head><body></body></html>`)
  printWindow.document.close()

  // Clone the element into the new window's body so relative assets resolve with the base href
  const clone = element.cloneNode(true) as HTMLElement

  // Convert any image src that is protocol-relative or root-relative to absolute using origin
  const imgs = Array.from(clone.querySelectorAll('img')) as HTMLImageElement[]
  imgs.forEach(img => {
    try {
      if (img.src && (img.getAttribute('src') || '').startsWith('/')) {
        img.src = origin + img.getAttribute('src')
      }
      // Force crossorigin for external images to improve html-to-image/pdf capture
      if (!img.getAttribute('crossOrigin')) img.setAttribute('crossOrigin', 'anonymous')
    } catch (e) {
      // ignore
    }
  })

  // Append cloned content
  printWindow.document.body.appendChild(clone)

  // Wait for all images in the print window to load (or timeout)
  const imagesInWindow = Array.from(printWindow.document.images) as HTMLImageElement[]
  await Promise.race([
    new Promise<void>((resolve) => {
      if (imagesInWindow.length === 0) return resolve()
      let remaining = imagesInWindow.length
      const onLoadOrError = () => {
        remaining -= 1
        if (remaining <= 0) resolve()
      }
      imagesInWindow.forEach(img => {
        if (img.complete) onLoadOrError()
        else {
          img.addEventListener('load', onLoadOrError)
          img.addEventListener('error', onLoadOrError)
        }
      })
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)) // 3s fallback
  ])

  // Small delay to allow fonts to render
  await new Promise(resolve => setTimeout(resolve, 80))

  try {
    printWindow.focus()
    printWindow.print()
  } catch (err) {
    console.error('Print failed', err)
  }
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
