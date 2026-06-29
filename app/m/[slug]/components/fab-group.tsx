'use client'

import React from 'react'


export function FabGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse gap-4 items-center pointer-events-none">
      {/* 
        pointer-events-none ensures the invisible flex container doesn't block clicks.
        We apply pointer-events-auto to the children.
      */}
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child
        return (
          <div className="pointer-events-auto">
            {child}
          </div>
        )
      })}
    </div>
  )
}
