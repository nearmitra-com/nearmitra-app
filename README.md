# NearMitra — Local Home Services Booking Platform

A full-stack hyperlocal services marketplace built with React + Supabase. Customers can book home services (electrician, plumber, carpenter, etc.), providers manage jobs end-to-end, and admins oversee the entire workflow.

---

## ✨ Features

- **Multi-language UI** — English, Hindi, Marathi
- **Customer Booking** — service selection, date/time, address, pre-selected from Services page
- **Provider Portal** — accept/reject jobs, site arrival, before/after photo capture (live camera), payment recording
- **Admin Dashboard** — manage bookings, assign providers, view history & earnings
- **AI Chatbot** — powered by Google Gemini
- **Real-time Updates** — Supabase live subscriptions

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | Google Gemini API |
| Icons | Lucide React |
| i18n | Custom context (`src/i18n/translations.ts`) |

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <repo-url>
cd  nearmitra
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Set Up Supabase Database
Run the migrations in order from `supabase/migrations/` in your Supabase SQL Editor.
Then run `supabase/fix_existing_providers.sql` if you have existing provider accounts.

### 4. Run Locally
```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/               # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── admin/            # Admin-specific components
│   ├── provider/         # Provider-specific components (CameraCapture, etc.)
│   ├── AIChatBot.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ServiceCard.tsx
├── pages/
│   ├── Index.tsx         # Homepage
│   ├── Services.tsx      # Services listing
│   ├── BookService.tsx   # Booking form
│   ├── ProviderLogin.tsx
│   ├── ProviderDashboard.tsx
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── CustomerLogin.tsx
│   ├── CustomerSignup.tsx
│   └── TrackBooking.tsx
├── hooks/
│   ├── useAuth.tsx       # Auth context + role resolution
│   └── use-toast.ts
├── contexts/
│   └── LanguageContext.tsx
├── i18n/
│   └── translations.ts   # All strings in EN / HI / MR
├── data/
│   └── services.ts       # Static service list with icons + images
└── integrations/
    └── supabase/         # Supabase client + generated types

supabase/
├── migrations/           # Ordered DB migrations (run these in Supabase)
├── functions/            # Edge functions (AI chat)
├── complete_database_setup.sql   # Full DB setup from scratch
└── fix_existing_providers.sql    # Fix missing user_roles for old accounts
```

---

## 👥 User Roles

| Role | Access | Login |
|------|--------|-------|
| Customer | Book services, track bookings | `/login` |
| Provider | Accept jobs, upload photos, record payment | `/provider-login` |
| Admin | Full dashboard, assign providers | `/admin-login` |

---

## 📸 Camera Feature (Provider)
The provider portal uses the **live device camera** (not gallery) for before/after job photos.  
Requires HTTPS in production. Works on `localhost` in development.

---

## 🌐 Deployment
Deploy to any static host (Netlify, Vercel):
```bash
npm run build
# Deploy the `dist/` folder
```
Make sure to set environment variables in your hosting provider's dashboard.
