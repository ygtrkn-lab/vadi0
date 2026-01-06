import React from 'react'
import { describe, it, expect } from 'vitest'
import ReactDOMServer from 'react-dom/server'
import OrderPrintTemplate from '@/components/OrderPrintTemplate'

describe('OrderPrintTemplate', () => {
  it('renders minimal order without crashing', () => {
    const sampleOrder = {
      orderNumber: 12345,
      createdAt: new Date().toISOString(),
      customerName: 'Ali Veli',
      customerPhone: '+905551112233',
      customerEmail: 'ali@example.com',
      delivery: {
        fullAddress: 'Acısu Mah. Örnek Cad. No:1, Istanbul',
        deliveryDate: '2026-01-08',
        deliveryTimeSlot: '13:00-15:00',
        deliveryNotes: 'Zil yerine kapıya bırakın'
      },
      items: [
        { name: 'Gül Buketi', quantity: 1, unitPrice: 149.9 }
      ],
      subtotal: 149.9,
      total: 149.9,
      note: 'Hızlı teslimat lütfen',
      message: {
        content: 'Bugün senin için biraz daha güzel olsun istedik. İyi ki varsın.',
        senderName: 'Seni çok seven çocukların💖'
      }
    }

    const el = React.createElement(OrderPrintTemplate as any, { order: sampleOrder })
    const html = ReactDOMServer.renderToStaticMarkup(el)
    expect(html).toContain('Sipariş #')
    expect(html).toContain('Gül Buketi')
    expect(html).toContain('Bugün senin için biraz daha güzel olsun istedik')
    expect(html).toContain('Seni çok seven çocukların')
    expect(html).not.toContain('HEDİYE')
    expect(html).toContain('✂')
    expect(html).toContain('Teslimat Tarihi')
    expect(html).toContain('Teslimat Notu')
  })

  it('renders gift message as gift note at the end and auto-fills fields', () => {
    const giftOrder = {
      orderNumber: 99999,
      createdAt: new Date().toISOString(),
      customerName: 'Veli Ali',
      delivery: { recipientName: 'Alıcı İsim', deliveryDate: '2026-01-08' },
      items: [{ name: 'Orkide', quantity: 1, unitPrice: 199 }],
      subtotal: 199,
      total: 199,
      message: {
        content: 'Sürpriz! Mutlu yıllar!',
        senderName: 'Sevgilerle',
        isGift: true
      }
    }

    const el = React.createElement(OrderPrintTemplate as any, { order: giftOrder })
    const html = ReactDOMServer.renderToStaticMarkup(el)
    expect(html).toContain('🎁 Hediye Notu')
    expect(html).not.toContain('Hediye Sertifikası')
    expect(html).not.toContain('KİME')
    expect(html).not.toContain('Alıcı İsim')
    expect(html).toContain('KİMDEN')
    expect(html).toContain('Sevgilerle')
    expect(html).not.toContain('AMOUNT')
    expect(html).not.toContain('EXP')
    expect(html).not.toContain('199')
    expect(html).toContain('/logo.png')
    expect(html).toContain('11.5cm')
    expect(html).toContain('9.5cm')
    expect(html).toContain('justify-content:flex-start')
    expect(html).toContain('✂')
    expect(html).toContain('dashed')
    expect(html).toContain('inset: 14')
    expect(html).toContain('line-height:16px')
    // QR container and size
    expect(html).toContain('data-qr')
    expect(html).toContain('102')
    // Overlays and dataset fallback present
    expect(html).not.toContain('data-recipient-name')
    expect(html).toContain('data-sender-name')
    expect(html).not.toContain('data-recipient-field')
    expect(html).toContain('data-sender-field')
    expect(html).toContain('max-height:150px')
    expect(html).toContain('font-size:14px')
    expect(html).toContain('line-height:20px')
    expect(html).toContain('font-size:12px')
    expect(html).toContain('font-size:13px')
    expect(html).toContain('Mutlu anlar için vadiler.com')
    expect(html).toContain('TheMunday')
    expect(html).toContain('text-transform:uppercase')
    expect(html).toContain('letter-spacing:1px')
    // Turkish support: container lang and Montserrat/Roboto fallback present
    expect(html).toContain('lang="tr"')
    expect(html).toContain('Montserrat')
    expect(html).toContain('Roboto')
    expect(html).toContain('font-display: swap')
    // Slogan smaller
    expect(html).toContain('font-size:9px')
    // Gift message uses TheMunday fallback and Roboto primary
    expect(html).toContain('TheMunday')
    expect(html).toContain('Roboto')
    expect(html).toContain('text-transform:none')
    expect(html).toContain('letter-spacing:0.2px')
    // Certificate markers present
    expect(html).toContain('data-certificate="true"')
    expect(html).toContain('data-gift-message="true"')
    expect(html).not.toContain('data-recipient-name')
    expect(html).toContain('data-sender-name')

    // ordering: logo -> message -> fields
    const msgPos = html.indexOf('Sürpriz! Mutlu yıllar!')
    const kimdenPos = html.indexOf('KİMDEN')
    const logoPos = html.indexOf('/logo.png')
    expect(logoPos).toBeLessThan(msgPos)
    expect(msgPos).toBeLessThan(kimdenPos)

    // Delivery date formatting
    expect(html).toContain('2026')
    expect(html).toContain('11:00-17:00')

    expect(html).not.toContain('💌 Mesaj Kartı')
  })

  it('formats ISO midnight UTC delivery dates correctly', () => {
    const sample = {
      orderNumber: 11111,
      createdAt: new Date().toISOString(),
      customerName: 'Test User',
      delivery: { deliveryDate: '2026-01-08T00:00:00.000Z', deliveryTimeSlot: '11:00-17:00' },
      items: [],
      subtotal: 0,
      total: 0
    }
    const el = React.createElement(OrderPrintTemplate as any, { order: sample })
    const html = ReactDOMServer.renderToStaticMarkup(el)
    // Should display the same calendar day (8 Ocak) and include the timeslot
    expect(html).toContain('8 Ocak')
    expect(html).toContain('11:00-17:00')
  })

  it('preparePrintableElement fills missing recipient/sender and applies QR/fit adjustments', async () => {
    const el = document.createElement('div')
    el.innerHTML = `
      <div data-certificate data-recipient-name="Alıcı İsim" data-sender-name="Gönderen İsim">
        <div data-gift-message style="width:120px;height:40px;font-size:12px;overflow:hidden">Sürpriz!</div>
        <div data-recipient-field></div>
        <div data-sender-field></div>
        <div data-qr style="width:120px;padding:4px"><svg></svg></div>
      </div>`

    // Not attaching the element ensures the helper will clone into a visible wrapper
    const { preparePrintableElement } = await import('@/lib/print')
    const { overlays, target } = await preparePrintableElement(el, document, window)

    const recipient = target.querySelector('[data-recipient-field]') as HTMLElement | null
    const sender = target.querySelector('[data-sender-field]') as HTMLElement | null
    expect(recipient?.textContent?.trim()).toBe('Alıcı İsim')
    expect(sender?.textContent?.trim()).toBe('Gönderen İsim')
    expect(Array.isArray(overlays)).toBe(true)

    // QR svg should have width/height attributes set by the helper
    const qrSvg = target.querySelector('[data-qr] svg') as SVGElement | null
    expect(qrSvg).toBeTruthy()
    expect(qrSvg?.getAttribute('width')).toBeTruthy()
    expect(qrSvg?.getAttribute('height')).toBeTruthy()
  })
})