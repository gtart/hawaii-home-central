# Hawaii Home Central

A premium, Hawaiʻi-first guide to renovating, maintaining, and loving your home—built with Next.js, Tailwind CSS, and TypeScript.

## Features

- **8 Premium Pages**: Home, About, Guides, Stories, Directory, Tools, Early Access, Contact
- **Dark Editorial Design**: Animated gradient backgrounds, subtle noise texture, tasteful motion
- **Accessibility-First**: Respects `prefers-reduced-motion`, semantic HTML, keyboard navigation
- **Early Access Form**: Native form with validation OR Tally.so embed (via environment variable)
- **Responsive**: Mobile-first design that works beautifully on all devices

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Fonts**: Playfair Display (serif) + Inter (sans) via next/font

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hawaii-home-central.git
   cd hawaii-home-central
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file (optional):
   ```bash
   cp .env.local.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_TALLY_FORM_URL` | Tally.so embed URL for early access form | No |

If `NEXT_PUBLIC_TALLY_FORM_URL` is set, the early access form will use Tally.so embed. Otherwise, it uses a native form with client-side validation and success message.

## Deployment to Vercel

### Option 1: Automated (via CLI)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Option 2: Git Integration (Recommended)

1. **Create a GitHub repository**:
   - Go to [github.com/new](https://github.com/new)
   - Create a new repository named `hawaii-home-central`

2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Hawaii Home Central website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/hawaii-home-central.git
   git push -u origin main
   ```

3. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your `hawaii-home-central` repository
   - Click "Deploy"

4. **Add Custom Domain** (optional):
   - In your Vercel project dashboard, go to Settings → Domains
   - Add your custom domain and follow the DNS configuration instructions

### Environment Variables in Vercel

If using Tally.so for form submissions:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `NEXT_PUBLIC_TALLY_FORM_URL` with your Tally form embed URL

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with nav/footer
│   ├── page.tsx            # Home page
│   ├── about/page.tsx
│   ├── guides/page.tsx
│   ├── stories/page.tsx
│   ├── directory/page.tsx
│   ├── tools/page.tsx
│   ├── early-access/page.tsx
│   └── contact/page.tsx
├── components/
│   ├── layout/             # Navigation, Footer
│   ├── home/               # Hero, About, FeatureCards
│   ├── forms/              # EarlyAccessForm, NativeForm, TallyEmbed
│   ├── ui/                 # Button, Input, Select, Card, Badge
│   └── effects/            # FadeInSection, NoiseOverlay
├── hooks/
│   └── useReducedMotion.ts # Reduced motion detection
└── lib/
    └── utils.ts            # Utility functions (cn)
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Basalt | `#1a1a1a` | Dark background |
| Cream | `#f5f0e8` | Primary text |
| Sandstone | `#c9a87c` | Accent color |
| Card radius | `20px` | Card corners |
| Button radius | `12px` | Button corners |

## Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

Copyright © 2024 Hawaii Home Central. All rights reserved.
