# Social Media Platform — UI Blueprint

**Vision**: Dark-mode first; deep navy/charcoal base with electric cyan accents and amber highlights. Premium, futuristic, human.

## Design Language
- Palette: background `#0D0F14`, surface `#161A23`, accent-cyan `#00D4FF`, accent-amber `#FFB347`, company-gold `#F4C542`, text-primary `#F0F2F5`, text-muted `#6B7280`, error `#FF4D4F`.
- Typography: Clash Display for headings (600–700), Sora for body/labels (400–500). Sizes: H1 32/40, H2 26/34, H3 22/30, body 16/24, small 14/20.
- Spacing: 8px base grid; vertical rhythm 12px; card padding 16–20px.
- Corners: cards 16px, inputs 12px, pills 999px.
- Shadows/Glow: cyan outer glow on active elements; soft elevation on surfaces.
- Iconography: thin outline; active state fills amber.

## Components (states implied)
- Buttons: primary cyan on surface; secondary ghost with cyan stroke; destructive error fill; focus ring cyan 2px; pressed scale 1.02.
- Inputs: surface background, muted placeholder, cyan focus ring; inline validation with error color and small text.
- Pills/Chips: cyan outline default, filled cyan for selected; amber variant for highlight.
- Avatars: circular; unread story ring gradient cyan→amber; online indicator small green dot.
- Cards: surface base, 16px radius; top row for meta; media 16px radius; action bar separated by subtle divider.
- Progress Bars: thin cyan segments for stories/reels; depleted segments muted.
- Badges: unread counts cyan fill; verified (company) gold badge.
- Tabs: indicator bar 2px cyan; inactive muted text.
- Floating Action: +Create neon-cyan circular with subtle bounce on hover/press.

## Navigation
- Bottom bar: Home, Explore, Create, Reels, Profile; active = cyan icon + top bar indicator; inactive muted.
- Top app bars: logo left, actions right (search, bell, DM); search bar present on Explore.
- Gestures: story tap left/right; reel vertical swipe; pull-to-refresh feeds; swipe down to close story viewer.

## Screen Specs
- Splash/Welcome: animated logo pulse cyan→amber; tagline fade; buttons Sign Up / Log In.
- Sign Up: fields name, email, phone, password; photo upload pill; interest chips multi-select; progress dots; CTA primary.
- Login: email or phone + password; biometric icon button; forgot password link; secondary text “Create account”.
- Profile Setup: avatar picker, username availability inline, bio with counter, category segmented (personal/business/creator).
- Home Feed: top bar with search/bell/DM; stories bar horizontal; post cards with avatar/name/time, media, action bar (like/comment/share/save), caption with “See more”, two-line comment preview; floating +Create bottom-right.
- Stories Viewer: full-screen; segmented progress top; tap nav; swipe down to close; bottom reaction rail with emoji strip + reply field. Story creation: camera/gallery, text overlays, stickers, music, polls, questions, countdown chips.
- Reels: vertical full-screen swipe; right rail stack (avatar+follow, like, comment, share, save); bottom ticker for song, caption overlay. Creation: record/trim, speed slider, filters, audio library tabs, text/sticker overlays.
- Direct Messaging: inbox list with avatar/name/last message/time/unread badge; filters All/Unread/Groups. Chat bubbles: sent cyan tint, received surface; reactions on long-press; reply thread inline; composer with mic/gallery/emoji/send; story replies display quoted preview; group member sheet.
- Company Connections: profile with banner, circular logo, gold verified badge, follow/connect buttons; tabs Posts, Products/Services, Jobs; special cards for jobs/promos with gold border and tag; discovery “Companies Near You” by industry chips; registration flow with business details, verification upload, category picker.
- Explore/Discover: top search pill with suggestions; trending hashtags row; masonry grid mixing photos/reels; category filter tabs (All, Videos, Photos, Companies, People, Places); “For You” carousel of suggestions.
- Notifications: grouped by Likes, Comments, Follows, Company, Tags/Mentions; each item avatar + action text + thumbnail + time; swipe actions mark read/mute; “Mark all as read” pill.
- User Profile: cover image, circular avatar with online dot; name/username/bio/website/location; stats row Posts/Followers/Following/Connections; tabs Posts grid, Reels, Tagged, Saved; buttons Edit Profile, Share (QR); follow variants Follow/Message.
- Create Post Flow: media picker grid with camera tile; caption editor with hashtag/mention autocomplete; toggles tag people/add location/link company; audience selector segmented (Public/Friends/Company followers/Only me); schedule picker; “Post as Story” switch.

## Motion
- Page enter: fade + 10px rise over 200ms.
- Buttons: press scale 1.05; hover glow.
- Stories/Reels: progress synced to media duration; story exit swipe-down easing.
- Bottom tab: micro-bounce on select; Create FAB idle breathe animation.
- Reduce motion: disable bounces/tickers when prefers-reduced-motion true.

## Accessibility
- Contrast ≥ 4.5:1; cyan/amber on dark surfaces adjusted as needed.
- Touch targets ≥ 44px; hit slop on small icons.
- Keyboard focus visible with cyan ring; logical order; skip-to-content link.
- Haptics on primary actions; captions for videos by default; alt text required on uploads.

## Tokens (CSS custom properties)
```css
:root {
  --bg: #0d0f14;
  --surface: #161a23;
  --accent-cyan: #00d4ff;
  --accent-amber: #ffb347;
  --company-gold: #f4c542;
  --text: #f0f2f5;
  --muted: #6b7280;
  --error: #ff4d4f;
  --radius-card: 16px;
  --radius-input: 12px;
  --radius-pill: 999px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
}
```

## Layout Guidance
- Mobile width 360–430 focus; responsive grid using 8px spacing; cards stretch full width with 16px horizontal padding.
- Reels/Stories occupy full height minus safe areas; actions rail offset 16px from right edge.
- Masonry tiles maintain 1:1 and 3:4 ratios; gutters 8px.

## Content Rules
- Captions truncate at 2 lines with “See more”.
- Time format relative with absolute on hover/long-press.
- Company promo cards carry gold left accent bar and “Promotion” tag.

## Handoff Notes
- Export logos/icons as SVG stroke-first; maintain 1.5px stroke width baseline.
- Use logical layer naming: `screen/section/component/state`.
- Provide animation specs in milliseconds and easing (standard cubic-bezier 0.22, 1, 0.36, 1).
