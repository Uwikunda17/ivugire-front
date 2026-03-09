import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../state/AuthContext'

export default function UpdateProfile() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const profile = await api.getProfile()
        setName(profile.name || '')
        setUsername(profile.username || '')
        setBio(profile.bio || '')
        setLocation(profile.location || '')
        setWebsite(profile.website || '')
        setAvatarUrl(profile.avatarUrl || '')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      await api.updateProfile({
        name,
        username,
        bio,
        location,
        website,
        avatarUrl,
      })
      await refreshProfile()
      setStatus('Profile updated successfully.')
      navigate('/profile')
    } catch (error) {
      setStatus((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-muted">Loading profile form...</div>

  return (
    <section className="workspace-page space-y-4">
      <div className="workspace-panel flex items-center justify-between">
        <div className="workspace-title">Update Profile</div>
        <Link to="/profile" className="text-slate-700 text-sm underline">
          Back
        </Link>
      </div>

      <form onSubmit={submit} className="workspace-panel space-y-4">
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-slate-700 focus:border-slate-500 outline-none"
          placeholder="Name"
        />
        <input
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-slate-700 focus:border-slate-500 outline-none"
          placeholder="Username"
        />
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-slate-700 min-h-[100px] focus:border-slate-500 outline-none"
          placeholder="Bio"
        />
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-slate-700 focus:border-slate-500 outline-none"
          placeholder="Location"
        />
        <input
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-slate-700 focus:border-slate-500 outline-none"
          placeholder="Website"
        />
        <input
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-slate-700 focus:border-slate-500 outline-none"
          placeholder="Avatar URL"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {status && <div className="text-sm text-slate-600">{status}</div>}
      </form>
    </section>
  )
}
