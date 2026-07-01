'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/utils/currency'

// Create styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA',
  },
  text: {
    fontSize: 12,
    color: '#333333',
  },
  textBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111111',
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#DDDDDD',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#999999',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  }
})

interface ReceiptPDFProps {
  orderId: string
  orgName: string
  date: string
  totalAmountMinor: number
  currencyCode: string
  items?: { name: string; quantity: number; price: number }[]
}

export const ReceiptDocument = ({ orderId, orgName, date, totalAmountMinor, currencyCode, items = [] }: ReceiptPDFProps) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{orgName}</Text>
        <Text style={styles.subtitle}>Payment Receipt</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.text}>Order ID:</Text>
          <Text style={styles.textBold}>#{orderId.split('-')[0]}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Date:</Text>
          <Text style={styles.textBold}>{new Date(date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Status:</Text>
          <Text style={styles.textBold}>Paid</Text>
        </View>
      </View>

      <View style={[styles.section, { marginTop: 10 }]}>
        <Text style={[styles.textBold, { marginBottom: 10 }]}>Order Items</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.text}>{item.quantity}x {item.name}</Text>
            <Text style={styles.text}>{formatCurrency(item.price, currencyCode)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Total Paid:</Text>
        <Text style={styles.totalText}>{formatCurrency(totalAmountMinor, currencyCode)}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Thank you for your order!</Text>
        <Text style={{ marginTop: 4 }}>Powered by OurMenu OS</Text>
      </View>
    </Page>
  </Document>
)

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function DownloadReceiptButton({ order, orgName, currencyCode }: { order: any, orgName: string, currencyCode: string }) {
  // Client-side only rendering for PDFDownloadLink to avoid hydration mismatch
  const isClient = React.useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)

  if (!isClient) return <div className="w-full h-14 bg-zinc-800 rounded-xl animate-pulse"></div>

  // Mock items if none exist on the order payload just for safety
  const items = order.order_items?.map((item: any) => ({
    name: item.item_name || 'Item',
    quantity: item.quantity || 1,
    price: item.price_minor || 0
  })) || []

  return (
    <PDFDownloadLink
      document={<ReceiptDocument 
        orderId={order.id} 
        orgName={orgName} 
        date={order.created_at || new Date().toISOString()} 
        totalAmountMinor={order.total_amount_minor} 
        currencyCode={currencyCode} 
        items={items}
      />}
      fileName={`Receipt_Order_${order.id.split('-')[0]}.pdf`}
      className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors mb-4"
    >
      {({ loading }) => (loading ? 'Preparing PDF...' : 'Download PDF Receipt')}
    </PDFDownloadLink>
  )
}
