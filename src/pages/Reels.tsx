import { useEffect, useState } from 'react'
import { api, type FeedItem } from '../api/client'
import ReelCard from '../components/cards/ReelCard'

export default function Reels() {
  const [reels, setReels] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReels() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.reels()
        setReels(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void loadReels()
  }, [])

  function handleMetricsChange(postId: string, changes: Partial<FeedItem>) {
    setReels((prev) => prev.map((reel) => (reel.id === postId ? { ...reel, ...changes } : reel)))
  }

  if (loading) return <div className="text-muted">Loading reels...</div>
  if (error) return <div className="text-red-400">{error}</div>

  if (reels.length === 0) {
    return (
      <section className="workspace-page">
        <div className="workspace-panel workspace-muted">
          No reels yet. Upload a video reel in Create. Videos longer than 5 minutes are trimmed.
        </div>
      </section>
    )
  }

  return (
    <section className=" space-y-4">
      <div className="workspace-panel">
        <h2 className="workspace-title">Reels</h2>
        <p className="workspace-muted text-sm">Tall video cards with interactive actions.</p>
      </div>
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} onMetricsChange={handleMetricsChange} />
      ))}
    </section>
  )
}
