import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'

export async function openPrintableWindow(element: HTMLElement) {
  if (!element) return
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) return

  const styles = `
    <style>
      @page { size: A4; margin: 12mm }
      body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin: 0; padding: 12mm; color: #111827 }
      img { max-width: 100%; }
    </style>
  `

  printWindow.document.open()
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8">${styles}</head><body>${element.outerHTML}</body></html>`)
  printWindow.document.close()

  // Wait for images/fonts to load
  const loaded = new Promise<void>((resolve) => {
    printWindow!.onload = () => setTimeout(() => resolve(), 50)
  })

  await loaded
  printWindow!.focus()
  printWindow!.print()
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
