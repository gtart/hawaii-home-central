'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'

export function SettingsContent() {
  const { data: session } = useSession()
  const { projects } = useProject()
  const [optedIn, setOptedIn] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Notification preferences
  const [notifyMention, setNotifyMention] = useState(true)
  const [notifyDigest, setNotifyDigest] = useState(true)
  const [notifLoaded, setNotifLoaded] = useState(false)
  const [notifSaving, setNotifSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/newsletter')
      .then((res) => res.json())
      .then((data) => {
        setOptedIn(data.optedIn ?? false)
        setIsLoaded(true)
      })
      .catch(() => setIsLoaded(true))

    fetch('/api/user/notification-preferences')
      .then((res) => res.json())
      .then((data) => {
        setNotifyMention(data.notifyOnMention ?? true)
        setNotifyDigest(data.notifyDailyDigest ?? true)
        setNotifLoaded(true)
      })
      .catch(() => setNotifLoaded(true))
  }, [])

  const toggleNotifPref = async (key: 'notifyOnMention' | 'notifyDailyDigest') => {
    const current = key === 'notifyOnMention' ? notifyMention : notifyDigest
    const newValue = !current
    if (key === 'notifyOnMention') setNotifyMention(newValue)
    else setNotifyDigest(newValue)
    setNotifSaving(key)

    try {
      await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      })
    } catch {
      if (key === 'notifyOnMention') setNotifyMention(current)
      else setNotifyDigest(current)
    } finally {
      setNotifSaving(null)
    }
  }

  const toggleNewsletter = async () => {
    const newValue = !optedIn
    setOptedIn(newValue)
    setIsSaving(true)

    try {
      await fetch('/api/newsletter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn: newValue }),
      })
    } catch {
      setOptedIn(!newValue)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-8">
          Settings
        </h1>

        <div className="bg-basalt-50 rounded-card p-6 mb-6">
          <h2 className="font-serif text-xl text-cream mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-cream/60">Email</span>
              <span className="text-cream/80">
                {session?.user?.email ?? '...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cream/60">Name</span>
              <span className="text-cream/80">
                {session?.user?.name ?? '...'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-basalt-50 rounded-card p-6 mb-6">
          <h2 className="font-serif text-xl text-cream mb-4">My Homes</h2>
          <div className="space-y-2 mb-4">
            {projects.filter((p) => p.status === 'ACTIVE').map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-cream/80 truncate">{p.name}</span>
                <span className="text-cream/30 text-xs shrink-0 ml-2">
                  {p.role === 'OWNER' ? 'Owner' : 'Shared'}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/app/projects"
            className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
          >
            Manage homes &rarr;
          </Link>
        </div>

        <div className="bg-basalt-50 rounded-card p-6">
          <h2 className="font-serif text-xl text-cream mb-4">
            Email preferences
          </h2>
          {isLoaded ? (
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={optedIn}
                  onChange={toggleNewsletter}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-basalt rounded-full peer-checked:bg-sandstone transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-cream rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <div>
                <span className="text-cream/80 text-sm block">
                  Email me occasional updates about new guides and tools
                </span>
                <span className="text-cream/40 text-xs block mt-1">
                  No spam, no sales pitches. Unsubscribe anytime.
                </span>
              </div>
            </label>
          ) : (
            <div className="h-12 flex items-center">
              <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
            </div>
          )}
          {isSaving && (
            <p className="text-cream/30 text-xs mt-3">Saving...</p>
          )}
        </div>

        <div className="bg-basalt-50 rounded-card p-6 mt-6">
          <h2 className="font-serif text-xl text-cream mb-4">
            Notifications
          </h2>
          {notifLoaded ? (
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={notifyMention}
                    onChange={() => toggleNotifPref('notifyOnMention')}
                    disabled={notifSaving !== null}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-basalt rounded-full peer-checked:bg-sandstone transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-cream rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <span className="text-cream/80 text-sm block">
                    Email me when someone @mentions me in a comment
                  </span>
                  <span className="text-cream/40 text-xs block mt-1">
                    Get notified when a collaborator tags you directly.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={notifyDigest}
                    onChange={() => toggleNotifPref('notifyDailyDigest')}
                    disabled={notifSaving !== null}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-basalt rounded-full peer-checked:bg-sandstone transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-cream rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <span className="text-cream/80 text-sm block">
                    Daily summary of new comments on my boards
                  </span>
                  <span className="text-cream/40 text-xs block mt-1">
                    One email per day with any new activity you haven&apos;t seen.
                  </span>
                </div>
              </label>
            </div>
          ) : (
            <div className="h-12 flex items-center">
              <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
            </div>
          )}
          {notifSaving && (
            <p className="text-cream/30 text-xs mt-3">Saving...</p>
          )}
        </div>
      </div>
    </div>
  )
}
