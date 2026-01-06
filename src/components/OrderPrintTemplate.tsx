'use client'

import React, { forwardRef } from 'react'
import QRCode from 'react-qr-code'

// Minimal typed interfaces for safety
interface OrderItem {
  name?: string
  title?: string
  variant?: string
  options?: string | Record<string, unknown>
  quantity?: number
  unitPrice?: number
  lineTotal?: number
  price?: number
  image?: string
  thumbnail?: string
  sku?: string
}

interface DeliveryInfo {
  recipientName?: string
  recipientPhone?: string
  fullAddress?: string
  street?: string
  addressLine2?: string
  neighborhood?: string
  district?: string
  city?: string
  postalCode?: string
  notes?: string
  deliveryDate?: string
  deliveryTimeSlot?: string
}

interface Order {
  id?: string | number
  orderNumber?: string | number
  createdAt?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  delivery?: DeliveryInfo
  items?: OrderItem[]
  products?: OrderItem[]
  subtotal?: number
  shipping?: number
  discount?: number
  total?: number
  note?: string
}

export type ProductLine = OrderItem & { product?: Partial<OrderItem>; qty?: number; unitPrice?: number; lineTotal?: number; sku?: string; image?: string; thumbnail?: string }

export interface OrderPrintTemplateProps {
  order: Order
}

const formatPrice = (price?: number) => {
  if (price == null) return '-'
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

const formatDate = (d?: string) => {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
  } catch { return d }
}

const OrderPrintTemplate = forwardRef<HTMLDivElement, OrderPrintTemplateProps>(({ order }, ref) => {
  if (!order) return null

  const address = (() => {
    const d = order.delivery || ({} as DeliveryInfo)
    const parts = [d.recipientName, d.street, d.addressLine2, d.neighborhood, d.city, d.postalCode].filter(Boolean)
    return parts.join(', ')
  })()

  const mapsUrl = `https://maps.google.com?q=${encodeURIComponent(address || (order.delivery?.fullAddress || ''))}`

  return (
    <div ref={ref} style={{ width: 800, padding: 24, background: '#fff', color: '#111827', fontFamily: 'Inter, system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <img src="/logo.png" alt="Vadiler Çiçek" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>Sipariş #{order.orderNumber}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(order.createdAt)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ width: 110, height: 110, padding: 6, background: '#f8fafc' }}>
            <QRCode value={mapsUrl} size={98} />
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
            Haritada aç
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Alıcı</div>
          <div style={{ fontWeight: 600 }}>{order.customerName || 'Misafir'}</div>
          {order.customerPhone && <div style={{ fontSize: 12, color: '#4b5563' }}>{order.customerPhone}</div>}
          {order.customerEmail && <div style={{ fontSize: 12, color: '#4b5563' }}>{order.customerEmail}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Teslimat Adresi</div>
          <div style={{ fontWeight: 600 }}>{order.delivery?.fullAddress || address}</div>
          {order.delivery?.notes && <div style={{ fontSize: 12, marginTop: 8, background: '#fffbeb', padding: 8, borderRadius: 6 }}>{order.delivery.notes}</div>}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8, paddingTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: 12, color: '#6b7280' }}>
              <th>Ürün</th>
              <th style={{ width: 60, textAlign: 'right' }}>Adet</th>
              <th style={{ width: 100, textAlign: 'right' }}>Birim</th>
              <th style={{ width: 100, textAlign: 'right' }}>Toplam</th>
            </tr>
          </thead>
          <tbody>
              {((order.items && order.items.length) ? order.items : order.products || []).map((it: ProductLine, idx: number) => {
              const product = (it as ProductLine).product || it
              const name = product.name || product.title || it.name || '—'
              const variant = it.variant || (typeof it.options === 'string' ? it.options : '') || product.variant || ''
              const qty = it.quantity ?? it.qty ?? 1
              const price = it.unitPrice ?? it.price ?? product.price ?? 0
              const line = it.lineTotal ?? (qty * price)
              const img = it.image || it.thumbnail || product.image || product.thumbnail || null
              const sku = product.sku || it.sku || null
              return (
                <tr key={idx} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ paddingTop: 8, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={String(name)} crossOrigin="anonymous" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 500 }}>{name}{variant ? ` — ${variant}` : ''}</div>
                      {sku && <div style={{ fontSize: 11, color: '#6b7280' }}>SKU: {sku}</div>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{qty}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(price)}</td>
                  <td style={{ textAlign: 'right' }}>{formatPrice(line)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <div style={{ width: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <div>Ara toplam</div>
              <div>{formatPrice(order.subtotal)}</div>
            </div>
            {order.shipping != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>Kargo</div>
                <div>{formatPrice(order.shipping)}</div>
              </div>
            )}
            {order.discount != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>İndirim</div>
                <div>-{formatPrice(order.discount)}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 6 }}>
              <div>Toplam</div>
              <div>{formatPrice(order.total)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 12, color: '#6b7280' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Notlar</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{order.note || '—'}</div>
      </div>

    </div>
  )
})

OrderPrintTemplate.displayName = 'OrderPrintTemplate'

export default OrderPrintTemplate
