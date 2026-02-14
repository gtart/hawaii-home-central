'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-cream/10 animate-pulse" />
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="text-cream/70 hover:text-sandstone transition-colors text-sm font-medium"
      >
        Sign In
      </Link>
    )
  }

  const initials = (session.user.name ?? session.user.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
          'bg-sandstone text-basalt hover:bg-sandstone-light'
        )}
        aria-expanded={isOpen}
        aria-label="Account menu"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="w-8 h-8 rounded-full"
          />
        ) : (
          initials
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-basalt-50 border border-cream/10 rounded-card shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-cream/10">
            <p className="text-sm text-cream font-medium truncate">
              {session.user.name ?? 'Account'}
            </p>
            <p className="text-xs text-cream/40 truncate">
              {session.user.email}
            </p>
          </div>
          <Link
            href="/app"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            My Toolkit
          </Link>
          <Link
            href="/app/settings"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            Settings
          </Link>
          <button
            onClick={() => {
              setIsOpen(false)
              signOut({ callbackUrl: '/' })
            }}
            className="block w-full text-left px-4 py-2 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
