'use client'

import { useState, useRef } from 'react'
import { ConfirmModal } from '@/components/ui/confirm-modal'

export function CancelButton() {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button 
        ref={buttonRef}
        type="button"
        className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors hover:underline px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg"
        onClick={() => setIsOpen(true)}
      >
        Cancel Subscription
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          if (buttonRef.current && buttonRef.current.form) {
            buttonRef.current.form.requestSubmit()
          }
        }}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle."
        confirmText="Yes, Cancel"
        isDestructive={true}
      />
    </>
  )
}
