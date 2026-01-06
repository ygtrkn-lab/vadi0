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

  // Build a robust maps query. Prefer the saved `fullAddress` if available — otherwise fall back to assembled parts.
  const mapsQuery = (() => {
    const d = order.delivery || ({} as DeliveryInfo)
    if (d.fullAddress && String(d.fullAddress).trim()) return String(d.fullAddress).trim()
    const parts = [d.street, d.addressLine2, d.neighborhood, d.district, d.city, d.postalCode].filter(Boolean)
    return parts.join(', ')
  })()

  // Use a redirect endpoint so QR opens the best map service for the device (Apple Maps on iOS, Google Maps otherwise)
  const base = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
  const mapsUrl = mapsQuery
    ? `${base}/api/maps/redirect?q=${encodeURIComponent(mapsQuery)}`
    : `${base}/api/maps/redirect`

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

      {/* Message Card (special template for gift messages) */}
      {((order.message && order.message.content && !order.message.isGift) || order.note) ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>💌 Mesaj Kartı</div>

          {/* Card for normal messages or note fallback */}
          <div style={{ borderRadius: 8, background: '#fff7f9', padding: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 16, lineHeight: 1.45, color: '#111827', whiteSpace: 'pre-wrap' }}>{order.message?.content || order.note}</div>
            {order.message?.senderName && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#6b7280' }}>— {order.message.senderName}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18, fontSize: 12, color: '#6b7280' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Notlar</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{order.note || '—'}</div>
        </div>
      )}

      {/* Add delivery details into Order Summary section (for invoice visibility) */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <div className={''}>Teslimat Tarihi</div>
          <div className={''}>{order.delivery?.deliveryDate ? `${order.delivery.deliveryDate}${order.delivery?.deliveryTimeSlot ? `, ${order.delivery.deliveryTimeSlot}` : ''}` : '—'}</div>
        </div>
        {order.delivery?.deliveryNotes && (
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <div className={''}>Teslimat Notu</div>
            <div style={{ color: '#6b7280' }}>{order.delivery.deliveryNotes}</div>
          </div>
        )}
      </div>

      {/* Gift note rendered last */}
      {order.message && order.message.content && order.message.isGift && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>🎁 Hediye Notu</div>

          <div style={{ position: 'relative', width: 360, height: 320, marginTop: 6, marginBottom: 12 }}>
            <div style={{ position: 'absolute', inset: 0, border: '2px dashed #9CA3AF', borderRadius: 10 }} />
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 14 }}>✂</div>
            <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 14 }}>✂</div>
            <div style={{ position: 'absolute', top: -6, left: -6, width: 12, height: 12, borderTop: '2px solid #9CA3AF', borderLeft: '2px solid #9CA3AF' }} />
            <div style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, borderTop: '2px solid #9CA3AF', borderRight: '2px solid #9CA3AF' }} />
            <div style={{ position: 'absolute', bottom: -6, left: -6, width: 12, height: 12, borderBottom: '2px solid #9CA3AF', borderLeft: '2px solid #9CA3AF' }} />
            <div style={{ position: 'absolute', bottom: -6, right: -6, width: 12, height: 12, borderBottom: '2px solid #9CA3AF', borderRight: '2px solid #9CA3AF' }} />

            <div style={{ position: 'absolute', inset: 12, background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', padding: '8px' }}>
                <p style={{ fontSize: 16, lineHeight: 1.45, margin: 0, color: '#111827', whiteSpace: 'pre-wrap', textAlign: 'left' }}>{order.message.content}</p>
              </div>
              {order.message.senderName && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>— {order.message.senderName}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
})

OrderPrintTemplate.displayName = 'OrderPrintTemplate'

export default OrderPrintTemplate
