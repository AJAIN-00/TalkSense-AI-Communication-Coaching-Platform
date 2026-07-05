# TalkSense — AI Communication Coach

TalkSense is a full-stack Next.js web application designed to help users practice their communication skills (conversational, interview prep, sales pitches, public speaking, conflict resolution) in real-time with Sofia — a photorealistic 3D human AI coach.

Sofia features natural micro-behaviors (blinking, breathing, eye gaze drift, active listening gestures) and lip-sync movements that dynamically update to spoken replies using client-side phoneme mapping.

---

## 🛠️ Prerequisites
- **Node.js** (v18.0.0 or higher)
- **NPM** or **Yarn**
- **Supabase** account (Free tier)
- **Google AI Studio** Gemini API Key (Free tier)

---

## ⚙️ Project Setup

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Open `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for administrative actions)
- `GEMINI_API_KEY` (obtained from Google AI Studio)

### 2. Configure Database & RLS Triggers
Create a new project on Supabase and run the initialization script in the **SQL Editor**:
👉 View file: [supabase/migrations/001_init.sql](./supabase/migrations/001_init.sql)

This script automatically handles:
- Creating `profiles` and `sessions` tables.
- Auto-inserting user details into `profiles` upon email signups via PostgreSQL triggers.
- Enabling Row Level Security (RLS) policies protecting user data.
- Creating indices for optimized search and dashboard queries.

### 3. Supply the 3D Avatar GLB Model
Sofia operates using standard ARKit mouth blend shapes.
- Place your GLB model into the static models folder:
  👉 `/public/models/avatar.glb`
- If no GLB model is present, the app gracefully falls back to a high-fidelity 2D canvas face that animates blinking, eyebrow movement, cheek shading, and mouth shape viseme transitions for a high-quality human likeness.

---

## 🚀 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Visit the app**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deploying to Vercel

1. Push this codebase to your own GitHub repository.
2. Go to [Vercel](https://vercel.com) and create a new project.
3. Link your GitHub repository.
4. Add the environment variables configured in `.env.local` inside the Vercel dashboard.
5. Deploy!
