import { UIOrder } from '@/lib/types/frontend'
import { PrinterMode } from '@/lib/stores/printer-store'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { ReceiptTemplate } from '@/components/thermal-printer/receipt-template'
import { 
  buildOrderReceiptBytes, 
  printDirectWebUsb, 
  printDirectWebSerial, 
  printDirectWebBluetooth 
} from './escpos-driver'

interface PrintSettings {
  mode: PrinterMode
  ipAddress?: string
  baudRate?: number
  businessName?: string
  businessType?: string
}

export async function printOrder(order: UIOrder, settings: PrintSettings): Promise<boolean> {
  try {
    switch (settings.mode) {
      case 'raw_escpos_usb': {
        const payload = buildOrderReceiptBytes(order, settings.businessName)
        return await printDirectWebUsb(payload)
      }
      case 'raw_escpos_serial': {
        const payload = buildOrderReceiptBytes(order, settings.businessName)
        return await printDirectWebSerial(payload, settings.baudRate || 9600)
      }
      case 'raw_escpos_bluetooth': {
        const payload = buildOrderReceiptBytes(order, settings.businessName)
        return await printDirectWebBluetooth(payload)
      }
      case 'epson_epos': {
        return await printViaEpsonEpos(order, settings)
      }
      case 'html_kiosk':
      default: {
        return await printViaHtmlKiosk(order, settings)
      }
    }
  } catch (err) {
    console.error('Printing failed:', err)
    return false
  }
}

async function printViaEpsonEpos(order: UIOrder, settings: PrintSettings): Promise<boolean> {
  if (!settings.ipAddress) throw new Error('No IP address configured for Epson printer')
  
  const eposXml = `
    <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
      <s:Body>
        <epos-print xmlns="urn:epson-upos-pOSPrint">
          <text lang="en"/>
          <text align="center"/>
          <text font="font_a" double_width="true" double_height="true"/>
          <text>${settings.businessName || 'WETAEGO'}\n</text>
          <text font="font_a" double_width="false" double_height="false"/>
          <text>Order #${order.id.split('-')[0]}\n</text>
          <text>----------------------------------------\n</text>
          <text align="left"/>
          ${order.order_items?.map(i => `<text>${i.quantity}x ${i.item_name}  ${(i.price_minor * i.quantity / 100).toFixed(2)}\n</text>`).join('')}
          <text>----------------------------------------\n</text>
          <text align="right"/>
          <text>TOTAL: ${(order.total_amount_minor / 100).toFixed(2)}\n</text>
          <cut type="feed"/>
        </epos-print>
      </s:Body>
    </s:Envelope>
  `

  const response = await fetch(`http://${settings.ipAddress}/cgi-bin/epos/dispacher.cgi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '""'
    },
    body: eposXml
  })

  return response.ok
}

async function printViaHtmlKiosk(order: UIOrder, settings: PrintSettings): Promise<boolean> {
  return new Promise((resolve) => {
    const htmlString = renderToString(
      createElement(ReceiptTemplate, {
        order,
        businessName: settings.businessName,
        businessType: settings.businessType,
      })
    )

    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      resolve(false)
      return
    }

    iframeDoc.open()
    iframeDoc.write(`
      <html>
        <head>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${htmlString}
        </body>
      </html>
    `)
    iframeDoc.close()

    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
        resolve(true)
      }, 1000)
    }, 500)
  })
}
