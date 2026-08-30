/**
 * Native ESC/POS Binary Driver for WebUSB, WebSerial & WebBluetooth
 * Enables direct raw binary bytecode transmission to thermal receipt printers
 * without requiring any local desktop bridge daemon or browser print dialog.
 */

import { UIOrder } from '@/lib/types/frontend'

export class EscposEncoder {
  private buffer: number[] = []

  constructor() {
    this.init()
  }

  init(): this {
    this.buffer.push(0x1B, 0x40) // ESC @ (Initialize printer)
    return this
  }

  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0
    this.buffer.push(0x1B, 0x61, val) // ESC a n
    return this
  }

  bold(enable: boolean): this {
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0) // ESC E n
    return this
  }

  size(widthMultiplier: number = 1, heightMultiplier: number = 1): this {
    const w = Math.min(Math.max(widthMultiplier - 1, 0), 7)
    const h = Math.min(Math.max(heightMultiplier - 1, 0), 7)
    const n = (w << 4) | h
    this.buffer.push(0x1D, 0x21, n) // GS ! n
    return this
  }

  text(str: string): this {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i])
    }
    return this
  }

  line(str: string = ''): this {
    this.text(str + '\n')
    return this
  }

  separator(char: string = '-', length: number = 32): this {
    this.align('center')
    this.line(char.repeat(length))
    this.align('left')
    return this
  }

  twoColumn(left: string, right: string, totalWidth: number = 32): this {
    const rightLen = right.length
    const leftMax = Math.max(0, totalWidth - rightLen - 1)
    const truncatedLeft = left.length > leftMax ? left.substring(0, leftMax - 1) + '.' : left
    const spaces = Math.max(1, totalWidth - truncatedLeft.length - rightLen)
    this.line(truncatedLeft + ' '.repeat(spaces) + right)
    return this
  }

  cut(full: boolean = false): this {
    this.feed(3)
    this.buffer.push(0x1D, 0x56, full ? 0 : 1) // GS V m (Cut paper)
    return this
  }

  feed(lines: number = 1): this {
    this.buffer.push(0x1B, 0x64, lines) // ESC d n
    return this
  }

  openCashDrawer(): this {
    this.buffer.push(0x1B, 0x70, 0, 25, 250) // ESC p m t1 t2
    return this
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer)
  }
}

/**
 * Generate raw binary ESC/POS payload for an order receipt
 */
export function buildOrderReceiptBytes(order: UIOrder, businessName?: string): Uint8Array {
  const encoder = new EscposEncoder()

  encoder
    .align('center')
    .size(2, 2)
    .bold(true)
    .line(businessName || 'WETAEGO')
    .size(1, 1)
    .bold(false)
    .line('Official Order Receipt')
    .separator('=')
    .align('left')
    .line(`Order ID: #${order.id.split('-')[0].toUpperCase()}`)
    .line(`Date: ${new Date(order.created_at).toLocaleString()}`)
    .line(`Status: ${order.status.toUpperCase()}`)
    .separator('-')
    .bold(true)
    .twoColumn('ITEM', 'AMOUNT')
    .bold(false)
    .separator('-')

  if (order.order_items && order.order_items.length > 0) {
    order.order_items.forEach((item) => {
      const price = ((item.price_minor * item.quantity) / 100).toFixed(2)
      encoder.twoColumn(`${item.quantity}x ${item.item_name}`, price)
    })
  }

  encoder
    .separator('-')
    .bold(true)
    .size(1, 2)
    .twoColumn('TOTAL:', `${(order.total_amount_minor / 100).toFixed(2)}`)
    .size(1, 1)
    .bold(false)
    .separator('=')
    .align('center')
    .line('Thank you for your business!')
    .line('Powered by WETAEGO')
    .cut()

  return encoder.getUint8Array()
}

/**
 * Direct WebUSB Raw Printing
 */
export async function printDirectWebUsb(payload: Uint8Array): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('usb' in navigator)) {
    throw new Error('WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.')
  }

  // @ts-expect-error - WebUSB types
  const device = await navigator.usb.requestDevice({ filters: [] })
  await device.open()
  if (device.configuration === null) {
    await device.selectConfiguration(1)
  }
  await device.claimInterface(0)

  // Find OUT endpoint
  const endpoint = device.configuration.interfaces[0].alternate.endpoints.find(
    (e: { direction: string }) => e.direction === 'out'
  )
  const endpointNumber = endpoint ? endpoint.endpointNumber : 1

  await device.transferOut(endpointNumber, payload)
  await device.close()
  return true
}

/**
 * Direct WebSerial Raw Printing (RS232 / USB Serial)
 */
export async function printDirectWebSerial(payload: Uint8Array, baudRate: number = 9600): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('WebSerial is not supported in this browser. Please use Chrome, Edge, or Opera.')
  }

  // @ts-expect-error - WebSerial types
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate })

  const writer = port.writable.getWriter()
  await writer.write(payload)
  writer.releaseLock()
  await port.close()
  return true
}

/**
 * Direct WebBluetooth Raw Printing
 */
export async function printDirectWebBluetooth(payload: Uint8Array): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    throw new Error('WebBluetooth is not supported in this browser.')
  }

  // @ts-expect-error - WebBluetooth types
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
    ]
  })

  const server = await device.gatt.connect()
  const services = await server.getPrimaryServices()
  if (!services || services.length === 0) throw new Error('No Bluetooth services found on printer.')

  const characteristics = await services[0].getCharacteristics()
  const writeChar = characteristics.find((c: { properties: { write: boolean, writeWithoutResponse: boolean } }) => c.properties.write || c.properties.writeWithoutResponse)
  if (!writeChar) throw new Error('No writable Bluetooth characteristic found.')

  // Chunk payload to 512 bytes for Bluetooth BLE MTU
  const chunkSize = 512
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize)
    if (writeChar.properties.writeWithoutResponse) {
      await writeChar.writeValueWithoutResponse(chunk)
    } else {
      await writeChar.writeValue(chunk)
    }
  }

  await device.gatt.disconnect()
  return true
}
