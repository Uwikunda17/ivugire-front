import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

// ─── Mock Data & Icons ────────────────────────────────────────────────────────
type IconProps = { size?: number }
const HeartIcon = ({ filled, size = 20 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const ChatIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const TrashIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const CloseIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SendIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const ChevronLeft = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Mock story data ──────────────────────────────────────────────────────────
const mockStories = [
  {
    id: "1",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    caption: "Golden hour at the summit — worth every step of the climb 🏔️",
    authorName: "Aria Chen",
    authorUsername: "aria.chen",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=47",
    likesCount: 284,
    commentsCount: 12,
  },
  {
    id: "2",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80",
    caption: "Morning mist over the valley. Nature's own filter 🌿",
    authorName: "Luca Moretti",
    authorUsername: "lucam",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=12",
    likesCount: 531,
    commentsCount: 27,
  },
  {
    id: "3",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    caption: "Every wave tells a different story. Lost count of how many I've heard today.",
    authorName: "Nora Blake",
    authorUsername: "norablake",
    authorAvatarUrl: "https://i.pravatar.cc/150?img=23",
    likesCount: 198,
    commentsCount: 8,
  },
];

const mockComments = [
  { id: "c1", body: "This is absolutely stunning! 😍", userName: "Maya K", username: "mayak", createdAt: "2m ago" },
  { id: "c2", body: "Where is this? I need to go!", userName: "Theo R", username: "theor", createdAt: "5m ago" },
  { id: "c3", body: "The lighting here is just perfect.", userName: "Sam J", username: "samj", createdAt: "12m ago" },
];

// ─── Avatar Component ─────────────────────────────────────────────────────────
type AvatarProps = { src?: string; name?: string; size?: number; className?: string; style?: CSSProperties }
const Avatar = ({ src, name, size = 40, className = "", style }: AvatarProps) => {
  const initials = name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["#E8D5C4","#C4D4E8","#C4E8D5","#E8C4D4","#D4C4E8"];
  const code = name ? name.charCodeAt(0) : 0;
  const bg = colors[code % colors.length] || "#E8D5C4";
  return src ? (
    <img src={src} alt={name} width={size} height={size}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", ...style }}
      className={className} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 600, color: "#555", flexShrink: 0, ...style }}
      className={className}>
      {initials}
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ count, current }: { count: number; current: number }) => (
  <div style={{ display: "flex", gap: 4, padding: "0 16px" }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: i <= current ? "white" : "rgba(255,255,255,0.35)", transition: "background 0.3s" }} />
    ))}
  </div>
);

// ─── Comment Item ─────────────────────────────────────────────────────────────
type StoryComment = { id: string; body: string; userName: string; username: string; createdAt: string }
const CommentItem = ({ comment }: { comment: StoryComment }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", animation: "fadeSlideUp 0.3s ease" }}>
    <Avatar name={comment.userName} size={32} />
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{comment.userName}</span>
        <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'DM Sans', sans-serif" }}>{comment.createdAt}</span>
      </div>
      <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "#444", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{comment.body}</p>
    </div>
  </div>
);

// ─── Main Story Viewer ────────────────────────────────────────────────────────
type StoryViewerProps = {
  story?: {
    id: string
    mediaType: 'image' | 'video' | 'audio'
    mediaUrl: string
    caption?: string
    authorName?: string
    authorUsername?: string
    authorAvatarUrl?: string | null
    likesCount?: number
    commentsCount?: number
  }
  onClose?: () => void
  onNavigate?: (direction: 'next' | 'prev') => void
}

export default function StoryViewer({ story: injectedStory, onClose: _onClose, onNavigate }: StoryViewerProps = {}) {
  const [storyIndex, setStoryIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<StoryComment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [panelSliding, setPanelSliding] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const story = injectedStory || mockStories[storyIndex];

  useEffect(() => {
    setPanelSliding(false);
    const t = setTimeout(() => setPanelSliding(true), 60);
    return () => clearTimeout(t);
  }, [storyIndex]);

  const navigate = (dir: 'next' | 'prev') => {
    const next = dir === "next" ? storyIndex + 1 : storyIndex - 1;
    if (injectedStory) {
      onNavigate?.(dir);
    } else if (next >= 0 && next < mockStories.length) {
      setCommentsOpen(false);
      setStoryIndex(next);
    }
  };

  const handleLike = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 600);
    setLiked(prev => ({ ...prev, [story.id]: !prev[story.id] }));
  };

  const submitComment = () => {
    const body = newComment.trim();
    if (!body) return;
    setComments(prev => [...prev, { id: Date.now().toString(), body, userName: "You", username: "you", createdAt: "just now" }]);
    setNewComment("");
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this story?")) return;
    setDeleted(true);
    setTimeout(() => { setDeleted(false); setStoryIndex(0); }, 1500);
  };

  const isLiked = liked[story?.id];
  const likesCount = (story?.likesCount || 0) + (isLiked ? 1 : 0);

  if (deleted) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#f9f6f3", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif" }}>
        <p style={{ color: "#bbb", fontSize: 18, letterSpacing: "0.05em" }}>Story removed.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes heartPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.45); }
          60%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes panelIn {
          from { transform: translateX(16px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        .story-bg { animation: fadeIn 0.4s ease; }
        .story-panel { animation: slideUp 0.45s cubic-bezier(0.16,1,0.3,1); }
        .panel-enter { animation: panelIn 0.35s cubic-bezier(0.16,1,0.3,1); }

        .nav-btn {
          background: rgba(255,255,255,0.92);
          border: none;
          cursor: pointer;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          color: #1a1a1a;
        }
        .nav-btn:hover { background: white; transform: scale(1.06); box-shadow: 0 4px 20px rgba(0,0,0,0.18); }
        .nav-btn:disabled { opacity: 0.3; cursor: default; transform: none; }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }

        .like-btn {
          background: white;
          color: #1a1a1a;
          box-shadow: 0 1px 8px rgba(0,0,0,0.1);
        }
        .like-btn.liked {
          background: #ff4d6d;
          color: white;
        }
        .like-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.15); }

        .comment-btn {
          background: white;
          color: #1a1a1a;
          box-shadow: 0 1px 8px rgba(0,0,0,0.1);
        }
        .comment-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.15); }

        .delete-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.5);
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }
        .delete-btn:hover { background: rgba(255,255,255,0.15); border-color: white; }

        .close-btn {
          position: absolute;
          top: 16px; right: 16px;
          z-index: 20;
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }
        .close-btn:hover { background: rgba(255,255,255,0.25); border-color: rgba(255,255,255,0.7); }

        .comment-input {
          flex: 1;
          border: 1.5px solid #ece8e4;
          border-radius: 100px;
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: #1a1a1a;
          background: #faf9f8;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .comment-input:focus { border-color: #c9b8a8; box-shadow: 0 0 0 3px rgba(180,155,130,0.12); background: white; }
        .comment-input::placeholder { color: #bbb; }

        .send-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: #1a1a1a;
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: white;
          flex-shrink: 0;
          transition: background 0.2s, transform 0.15s;
        }
        .send-btn:hover { background: #333; transform: scale(1.06); }
        .send-btn:disabled { opacity: 0.35; cursor: default; transform: none; }

        .comments-panel {
          background: white;
          border-top: 1px solid #f0ebe6;
          animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1);
        }

        .author-ring {
          padding: 2px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f8d7c2 0%, #f0c4d4 50%, #c8d4f0 100%);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0d8d0; border-radius: 4px; }
      `}</style>

      {/* ── Backdrop ── */}
      <div className="story-bg" style={{ position: "fixed", inset: 0, background: "rgba(20,18,16,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>

        {/* ── Card ── */}
        <div className="story-panel" style={{ width: "100%", maxWidth: 420, borderRadius: 28, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative" }}>

          {/* ── Media Area ── */}
          <div className={panelSliding ? "panel-enter" : ""} style={{ position: "relative", width: "100%", aspectRatio: "9/16", maxHeight: "72vh", background: "#111" }}>
            <img
              src={story.mediaUrl}
              alt={story.caption}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />

            {/* Gradient layers */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />

            {/* Close */}
            <button className="close-btn" onClick={() => alert("Close")}>
              <CloseIcon size={16} />
            </button>

            {/* Progress + Header at top */}
            <div style={{ position: "absolute", top: 16, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
              {/* Progress */}
              <ProgressBar count={mockStories.length} current={storyIndex} />

              {/* Author row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                <div className="author-ring">
                  <Avatar src={story.authorAvatarUrl || undefined} name={story.authorName} size={36} style={{ border: "2px solid transparent" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 14, color: "white", lineHeight: 1.2 }}>{story.authorName}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>@{story.authorUsername}</p>
                </div>
                {/* Delete */}
                <button className="delete-btn" onClick={handleDelete}>
                  <TrashIcon size={15} />
                </button>
              </div>
            </div>

            {/* Caption */}
            {story.caption && (
              <div style={{ position: "absolute", bottom: 72, left: 16, right: 16 }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 14.5, color: "white", lineHeight: 1.65, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(10px)", borderRadius: 14, padding: "10px 14px", borderLeft: "2.5px solid rgba(255,255,255,0.5)" }}>
                  {story.caption}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ position: "absolute", bottom: 18, left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Like */}
                <button
                  className={`action-btn like-btn ${isLiked ? "liked" : ""}`}
                  onClick={handleLike}
                  style={{ animation: likeAnimating ? "heartPop 0.6s ease" : "none" }}
                >
                  <HeartIcon filled={isLiked} size={16} />
                  <span>{likesCount.toLocaleString()}</span>
                </button>

                {/* Comments */}
                <button className="action-btn comment-btn" onClick={() => setCommentsOpen(o => !o)}>
                  <ChatIcon size={16} />
                  <span>{comments.length}</span>
                </button>
              </div>

              {/* Nav */}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="nav-btn" onClick={() => navigate("prev")} disabled={storyIndex === 0}>
                  <ChevronLeft size={18} />
                </button>
                <button className="nav-btn" onClick={() => navigate("next")} disabled={storyIndex === mockStories.length - 1}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Comments Panel ── */}
          {commentsOpen && (
            <div className="comments-panel" style={{ maxHeight: 300, display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid #f5f0ec", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>Comments</h3>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#aaa", background: "#f5f0ec", borderRadius: 100, padding: "3px 10px" }}>{comments.length}</span>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {comments.length > 0
                  ? comments.map(c => <CommentItem key={c.id} comment={c} />)
                  : <p style={{ textAlign: "center", color: "#ccc", fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "16px 0" }}>No comments yet — be the first.</p>
                }
              </div>

              {/* Input */}
              <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #f5f0ec", display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  ref={inputRef}
                  className="comment-input"
                  type="text"
                  placeholder="Say something..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()}
                />
                <button className="send-btn" onClick={submitComment} disabled={!newComment.trim()}>
                  <SendIcon size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Story counter dot ── */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {mockStories.map((_, i) => (
            <button key={i} onClick={() => { setStoryIndex(i); setCommentsOpen(false); }}
              style={{ width: i === storyIndex ? 22 : 7, height: 7, borderRadius: 100, background: i === storyIndex ? "white" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", padding: 0 }} />
          ))}
        </div>
      </div>
    </>
  );
}
