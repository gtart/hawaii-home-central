'use client'

import type { ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { MobileBottomNav } from './MobileBottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SidebarNav />
      <div className="md:ml-56">
        {children}
      </div>
      <MobileBottomNav />
    </>
  )
}
