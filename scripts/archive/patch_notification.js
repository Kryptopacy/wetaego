const fs = require('fs')

const path = 'app/(dashboard)/notification-center.tsx'
let content = fs.readFileSync(path, 'utf8')

// Import hook
if (!content.includes('useAudioAlert')) {
  content = content.replace(
    `import { Bell } from 'lucide-react'`,
    `import { Bell } from 'lucide-react'\nimport { useAudioAlert } from '@/lib/hooks/use-audio'`
  )
}

// Add hook inside component
if (!content.includes('const { playChime } = useAudioAlert()')) {
  content = content.replace(
    `  const [isOpen, setIsOpen] = useState(false)`,
    `  const [isOpen, setIsOpen] = useState(false)\n  const { playChime } = useAudioAlert()`
  )
}

// Trigger chime on order INSERT
content = content.replace(
  `        if (payload.eventType === 'INSERT') {
          if (['pending', 'paid'].includes(payload.new.status as string)) {
            setItems(prev => [toOrderItem(payload.new), ...prev])
          }
        }`,
  `        if (payload.eventType === 'INSERT') {
          if (['pending', 'paid'].includes(payload.new.status as string)) {
            playChime()
            setItems(prev => [toOrderItem(payload.new), ...prev])
          }
        }`
)

// Trigger chime on service request INSERT
content = content.replace(
  `        if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
          setItems(prev => [toRequestItem(payload.new), ...prev])
        }`,
  `        if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
          playChime()
          setItems(prev => [toRequestItem(payload.new), ...prev])
        }`
)

// Trigger chime on booking INSERT
content = content.replace(
  `            if ((data as any as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id === orgId) {
              setItems(prev => [toBookingItem(data as Record<string, unknown>), ...prev])
            }`,
  `            if ((data as any as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id === orgId) {
              playChime()
              setItems(prev => [toBookingItem(data as Record<string, unknown>), ...prev])
            }`
)

// Trigger chime on inquiry INSERT
content = content.replace(
  `            if ((data as any as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id === orgId) {
              setItems(prev => [toInquiryItem(data as Record<string, unknown>), ...prev])
            }`,
  `            if ((data as any as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id === orgId) {
              playChime()
              setItems(prev => [toInquiryItem(data as Record<string, unknown>), ...prev])
            }`
)

// Also fix hardcoded ₦ in NotificationCenter since we are here
if (!content.includes('import { formatCurrency }')) {
  content = content.replace(
    `import { useAudioAlert } from '@/lib/hooks/use-audio'`,
    `import { useAudioAlert } from '@/lib/hooks/use-audio'\nimport { formatCurrency } from '@/lib/utils/currency'`
  )
}

content = content.replace(
  `subtitle: \`Table \${o.table_identifier || 'Takeaway'} · ₦\${((o.total_amount_minor as number || 0) / 100).toLocaleString()}\`,`,
  `subtitle: \`Table \${o.table_identifier || 'Takeaway'} · \${formatCurrency((o.total_amount_minor as number) || 0, o.currency_code as string || 'NGN')}\`,`
)

fs.writeFileSync(path, content)
console.log('Fixed notification-center.tsx')
