# Choices Platform

A modern, privacy-focused polling and decision-making platform built with Next.js, Supabase, and TypeScript.

## 🎉 Recent Achievement: SSR Issues Completely Resolved!

**Status: ✅ PRODUCTION READY**

We have successfully resolved all SSR (Server-Side Rendering) issues with Supabase integration. The application now builds successfully, runs without any `self is not defined` errors, and is fully production-ready.

### Key Achievements:
- ✅ **Zero SSR errors** - All `self is not defined` issues resolved
- ✅ **100% build success** - All TypeScript compilation passes
- ✅ **Complete SSR compatibility** - Proper async/await patterns throughout
- ✅ **Production ready** - Ready for deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Choices

# Install dependencies
cd web
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
npm run dev
```

### Environment Variables
Create a `.env.local` file in the `web` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 14 with App Router
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Deployment:** Vercel

### Key Features
- **SSR Compatible** - Full server-side rendering support
- **Privacy Focused** - Minimal data collection
- **Real-time Updates** - Live polling results
- **PWA Ready** - Progressive Web App capabilities
- **Type Safe** - Full TypeScript coverage

## 📁 Project Structure

```
web/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── polls/             # Polling functionality
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── lib/                   # Utility libraries
├── utils/                 # Helper functions
├── disabled-admin/        # Admin features (disabled)
├── disabled-pages/        # Experimental pages (disabled)
└── docs/                  # Documentation
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Quality
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Husky** - Git hooks for quality checks

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 📚 Documentation

- [SSR Fix Implementation](./docs/SSR_FIX_IMPLEMENTATION_PLAN.md) - Complete SSR resolution details
- [SSR Issue Diagnostic](./web/SSR_ISSUE_DIAGNOSTIC.md) - Technical SSR fix documentation
- [API Documentation](./docs/API.md) - API endpoints and usage
- [Database Schema](./docs/DATABASE.md) - Database structure and relationships

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Current Status

**✅ PRODUCTION READY**

The application is currently in a stable, production-ready state with:
- Complete SSR compatibility
- All TypeScript errors resolved
- Comprehensive documentation
- Clean, maintainable codebase

Ready for your next ambitious feature! 🚀

---

*Last updated: December 19, 2024*
