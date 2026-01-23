# Student Societies MVP

A cross-university student societies platform built with Next.js, Supabase, and Cloudinary.

## Features

- 🏠 Public homepage showing society posts and upcoming events
- 🎓 Public society pages (discoverable without login)
- 🔐 Email-based authentication via Supabase Auth
- 👥 Society membership system (request to join, admin approval)
- 💬 Real-time group chat per society (text-only)
- 📢 Announcements/posts section with image support
- 🖼️ Cloudinary image handling for logos, posters, profile pictures

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Images**: Cloudinary
- **Deployment**: Vercel-ready

## Getting Started

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

\`\`\`bash
cp .env.example .env.local
\`\`\`

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations from \`supabase/schema.sql\` in the Supabase SQL Editor
3. Enable Realtime for the \`chat_messages\` table
4. Configure Email Auth in Authentication > Providers

### 3. Cloudinary Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name from the dashboard
3. Create an unsigned upload preset for client-side uploads

### 4. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (public)/          # Public routes (home, societies)
│   ├── dashboard/         # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── society/          # Society-related components
│   └── chat/             # Chat components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client configs
│   └── cloudinary/       # Cloudinary utilities
└── types/                # TypeScript type definitions
\`\`\`

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

## License

MIT
