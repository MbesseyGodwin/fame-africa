// apps/web/src/app/dashboard/settings/page.tsx

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../../hooks/useAuthStore'
import { usersApi } from '../../../lib/api'
import { useRouter } from 'next/navigation'

export default function DashboardSettingsPage() {
  const { user, refreshUser } = useAuthStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPhotoLoading, setIsPhotoLoading] = useState(false)

  const [formData, setFormData] = useState({
    bio: '',
    displayName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  })

  const [themePrefs, setThemePrefs] = useState({
    darkMode: false,
    colorTheme: 'default',
    primaryColor: '#534AB7',
    buttonColor: '#534AB7',
    headerColor: '#534AB7',
    accentColor: '#EEEDFE',
    cardBackground: '#ffffff',
    textOnPrimary: '#ffffff',
    fontFamily: 'system-ui,sans-serif',
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: '400',
    borderRadius: '8px',
    compactMode: false,
    showAvatars: true,
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true
  })

  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        displayName: user.displayName || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
      })
      // Fetch UI preferences
      usersApi.getPreferences().then(res => {
        if (res.data?.data) {
          setThemePrefs(prev => ({ ...prev, ...res.data.data }))
        }
      }).catch(err => console.error("Could not load preferences"))
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMsg('')
    try {
      await usersApi.updateMe({
        displayName: formData.displayName,
        bio: formData.bio
      })
      await refreshUser()
      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMsg('')
    try {
      await usersApi.updatePhone({ phone: formData.phone })
      await refreshUser()
      setSuccessMsg('Phone number updated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to update phone')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMsg('')
    try {
      if (!formData.currentPassword || !formData.newPassword) {
        alert('Please enter both current and new passwords.')
        setIsLoading(false)
        return
      }
      await usersApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      setSuccessMsg('Password changed successfully!')
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }))
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMsg('')
    try {
      await usersApi.updatePreferences(themePrefs)
      document.documentElement.classList.toggle('dark', themePrefs.darkMode)
      setSuccessMsg('Settings saved successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsPhotoLoading(true)
    const formData = new FormData()
    formData.append('photo', file)

    try {
      await usersApi.updatePhoto(formData)
      await refreshUser()
      setSuccessMsg('Profile photo updated!')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      console.error(err)
      alert('Failed to upload photo')
    } finally {
      setIsPhotoLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex justify-between items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        </div>

        {successMsg && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800 text-sm font-medium">
            ✓ {successMsg}
          </div>
        )}

        <div className="space-y-8">
          {/* Section: Profile */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span>👤</span> Campaign Profile
            </h2>
            
            <div className="mb-8 flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 border-4 border-white dark:border-gray-800 shadow-md">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                      {user.fullName?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {isPhotoLoading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <div className="flex-1 text-center sm:text-left pt-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{user.fullName}</h3>
                <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Change Profile Picture
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none resize-none"
                  placeholder="Tell voters why they should vote for you..."
                />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isLoading} className="bg-primary text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50">
                  Update Profile
                </button>
              </div>
            </form>
          </div>

          {/* Section: Security & Contact */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🔒</span> Security & Contact Info
            </h2>

            <form onSubmit={handleUpdatePhone} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    placeholder="+234..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                  />
                  <button type="submit" disabled={isLoading} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95 disabled:opacity-50">
                    Update Phone
                  </button>
                </div>
              </div>
            </form>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Change Password</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isLoading} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95 disabled:opacity-50">
                  Change Password
                </button>
              </div>
            </form>
          </div>

          {/* Section: Danger Zone (Participants Only) */}
          {user?.role === 'PARTICIPANT' && (
            <div className="bg-red-50 dark:bg-rose-950/20 border border-red-100 dark:border-rose-900 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <span>⚠️</span> Danger Zone
              </h2>
              <p className="text-sm text-red-600 dark:text-red-300/80 max-w-2xl">
                Withdrawing from the competition is permanent and irreversible. You will instantly be disqualified
                and removed from all active leaderboards.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => router.push('/dashboard/withdraw')}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-95"
                >
                  Withdraw from Competition
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-8">
            {/* Section: Themes & Colors */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>🎨</span> Appearance & Theme
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Dark Mode</span>
                    <span className="block text-xs text-gray-500">Enable high-contrast dark theme</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setThemePrefs({ ...themePrefs, darkMode: !themePrefs.darkMode })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${themePrefs.darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${themePrefs.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <ColorInput label="Primary color" value={themePrefs.primaryColor} onChange={(v) => setThemePrefs({ ...themePrefs, primaryColor: v })} />
                  <ColorInput label="Button color" value={themePrefs.buttonColor} onChange={(v) => setThemePrefs({ ...themePrefs, buttonColor: v })} />
                  <ColorInput label="Header color" value={themePrefs.headerColor} onChange={(v) => setThemePrefs({ ...themePrefs, headerColor: v })} />
                  <ColorInput label="Accent color" value={themePrefs.accentColor} onChange={(v) => setThemePrefs({ ...themePrefs, accentColor: v })} />
                  <ColorInput label="Card backgrd" value={themePrefs.cardBackground} onChange={(v) => setThemePrefs({ ...themePrefs, cardBackground: v })} />
                  <ColorInput label="Text on prim" value={themePrefs.textOnPrimary} onChange={(v) => setThemePrefs({ ...themePrefs, textOnPrimary: v })} />
                </div>
              </div>
            </div>

            {/* Section: Typography */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>🔤</span> Typography
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Font Family</label>
                  <select
                    value={themePrefs.fontFamily}
                    onChange={(e) => setThemePrefs({ ...themePrefs, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-sm outline-none"
                  >
                    <option value="system-ui,sans-serif">System Sans</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="serif">Classic Serif</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Font Size (px)</label>
                    <input
                      type="number"
                      value={themePrefs.fontSize}
                      onChange={(e) => setThemePrefs({ ...themePrefs, fontSize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight</label>
                    <select
                      value={themePrefs.fontWeight}
                      onChange={(e) => setThemePrefs({ ...themePrefs, fontWeight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-sm outline-none"
                    >
                      <option value="300">Light</option>
                      <option value="400">Regular</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi-Bold</option>
                      <option value="700">Bold</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Layout & UI */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>📱</span> Interface & Layout
              </h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Border Radius</label>
                    <div className="flex gap-2">
                      {['0px', '4px', '8px', '12px', '16px', '99px'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setThemePrefs({ ...themePrefs, borderRadius: r })}
                          className={`flex-1 py-1 px-2 border rounded text-[10px] transition-all ${themePrefs.borderRadius === r ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:border-primary'}`}
                        >
                          {r === '99px' ? 'Round' : r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-5">
                    <Toggle label="Compact Mode" checked={themePrefs.compactMode} onChange={(v) => setThemePrefs({ ...themePrefs, compactMode: v })} />
                    <Toggle label="Show Avatars" checked={themePrefs.showAvatars} onChange={(v) => setThemePrefs({ ...themePrefs, showAvatars: v })} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Notifications */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>🔔</span> Notifications
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Toggle label="Email Alerts" checked={themePrefs.emailNotifications} onChange={(v) => setThemePrefs({ ...themePrefs, emailNotifications: v })} />
                <Toggle label="SMS Alerts" checked={themePrefs.smsNotifications} onChange={(v) => setThemePrefs({ ...themePrefs, smsNotifications: v })} />
                <Toggle label="Push Notifications" checked={themePrefs.pushNotifications} onChange={(v) => setThemePrefs({ ...themePrefs, pushNotifications: v })} />
              </div>
            </div>

            <div className="sticky bottom-4 z-40">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white px-6 py-4 rounded-xl font-bold shadow-2xl hover:bg-primary/95 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Saving changes...' : 'Save All Preferences'}
              </button>
            </div>
          </form>

          {/* Section: Account Metadata */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span>📊</span> Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
              <MetadataRow label="User ID" value={user.id} />
              <MetadataRow label="Role" value={user.role} />
              <MetadataRow label="Account Status" value={user.isActive ? 'Active' : 'Suspended'} />
              <MetadataRow label="Email Verified" value={user.emailVerified ? 'Yes' : 'No'} />
              <MetadataRow label="Phone Verified" value={user.phoneVerified ? 'Yes' : 'No'} />
              <MetadataRow label="Password" value="[SECURED • SET]" />
              <MetadataRow label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'} />
              <MetadataRow label="Joined On" value={new Date(user.createdAt).toLocaleString()} />
              <MetadataRow label="Last Updated" value={new Date(user.updatedAt).toLocaleString()} />
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800/50">
              <p className="text-[10px] text-gray-400 leading-relaxed italic">
                Our system maintains detailed audit logs of all profile changes and voting activity to ensure platform integrity.
                To request data deletion under Pan-African GDPR-equivalent laws, please contact our legal desk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetadataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 md:border-b-0 md:hover:bg-gray-50/50 md:dark:hover:bg-white/5 px-1 rounded-lg transition-colors">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300 font-mono text-right break-all ml-4">{value}</span>
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg overflow-hidden border-none outline-none cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs font-mono px-2 py-1.5 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-gray-950 outline-none"
        />
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
      >
        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{label}</span>
    </label>
  )
}
