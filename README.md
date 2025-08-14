# Choices - Democratic Polling Platform

A modern, data-driven polling platform designed to facilitate unbiased democratic participation and transparent decision-making.

## 🚀 **Current Status**

### ✅ **Recent Features**

#### **Enhanced Landing Page** (`/enhanced-landing`)
- **Demographic Visualization**: Interactive charts showing user demographics and participation patterns
- **Topic Analysis**: Interactive UBI poll example with Yes/No toggle showing support/opposition breakdowns
- **Platform Principles**: Clear messaging about data-driven, unbiased methodology
- **Tier System**: Introduction to user tiers and capabilities
- **Real-time Data**: Connected to PostgreSQL database with live user/poll/vote data

#### **Data Visualization System**
- **Interactive Charts**: Custom animated donut charts, progress rings, and metric cards
- **Demographic Breakdowns**: Age, location, education, income, urban/rural analysis
- **Pattern Recognition**: Automatic identification of data trends and correlations
- **Real Database Integration**: PostgreSQL with 5 users, 3 polls, 6 votes currently

#### **Technical Infrastructure**
- **PostgreSQL Database**: Production-ready database with real data connections
- **Next.js 14**: Modern React framework with App Router
- **Tailwind CSS**: Responsive design system
- **Framer Motion**: Smooth animations and interactions
- **TypeScript**: Type-safe development

### 🎯 **Key Features**

#### **Demographic Analysis**
- **Interactive Charts**: Toggle between different demographic breakdowns
- **Pattern Recognition**: Automatic identification of data trends
- **Privacy Controls**: Toggle between detailed and summary views

#### **Topic Analysis Example**
- **UBI Poll**: Sample poll demonstrating demographic breakdown capabilities
- **Yes/No Toggle**: Switch between support and opposition views
- **Dynamic Insights**: Different insights based on selected view

#### **Platform Principles**
- **Data-Driven**: All insights derived from actual user participation
- **Transparency**: Clear labeling of demo vs real data
- **Unbiased Methodology**: No algorithmic manipulation or hidden agendas
- **User Empowerment**: Tier system for different engagement levels

### 🏗️ **Architecture**

```
Choices/
├── web/                          # Next.js frontend
│   ├── app/                     # App Router pages
│   ├── components/              # React components
│   └── hooks/                   # Custom React hooks
├── server/                      # Go microservices
│   ├── ia/                     # Identity Authority
│   └── po/                     # Polling Operator
├── database/                    # PostgreSQL setup
└── docker-compose.yml          # Development environment
```

### 🗄️ **Database Schema**

#### **Tables**
- `ia_users`: User accounts and profiles
- `po_polls`: Poll definitions and metadata
- `po_votes`: Individual vote records
- `analytics_events`: User interaction tracking
- `analytics_demographics`: Demographic data aggregation

#### **Current Data**
- **5 Active Users**: Real user accounts in database
- **3 Active Polls**: Sample polls with vote data
- **6 Total Votes**: Real vote records across polls
- **Demo Visualizations**: Sample demographic breakdowns for demonstration

### 🎨 **Design System**

#### **Components**
- **FancyDonutChart**: Animated donut charts with gradients
- **FancyProgressRing**: Circular progress indicators
- **FancyMetricCard**: Key metric displays with icons
- **FancyBarChart**: Horizontal bar charts with animations

### 🚀 **Getting Started**

#### **Prerequisites**
- Node.js 18+
- Docker and Docker Compose

#### **Development Setup**
```bash
# Clone the repository
git clone https://github.com/choices-project/choices.git
cd choices

# Start the development environment
docker-compose up -d

# Install frontend dependencies
cd web
npm install

# Start the development server
npm run dev
```

#### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### 🌐 **Available Pages**

- **`/`**: Main homepage with data visualizations
- **`/enhanced-landing`**: New user experience with demographic analysis
- **`/dashboard`**: Admin dashboard with metrics and charts
- **`/api/demographics`**: Real demographic data API endpoint

### 📊 **Current Metrics**

- **Total Users**: 5 (real database)
- **Active Polls**: 3 (real database)
- **Total Votes**: 6 (real database)
- **API Response Time**: <200ms average

### 🔄 **Development Workflow**

#### **Current Branch**: `feature/enhanced-landing-user-profiles`
- **Status**: Active development
- **Next Phase**: User profile system implementation

#### **Git Branches**
- `main`: Production-ready code
- `feature/enhanced-landing-user-profiles`: Current feature development
- `po-service`: Polling Operator service
- `merkle-commitments`: Cryptographic integrity
- `webauthn-integration`: WebAuthn integration
- `production-readiness`: Production deployment
- `advanced-features`: Advanced polling features
- `dashboard-enhancements`: Dashboard improvements
- `mobile-app`: Mobile application

### 🎯 **Next Steps**

#### **User Profile System**
- [ ] User profile database schema
- [ ] Profile creation and editing
- [ ] Tier management system
- [ ] User preferences and settings

#### **Advanced Polling**
- [ ] Poll creation interface
- [ ] Advanced question types
- [ ] Poll sharing and embedding
- [ ] Real-time results

### 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 **License**

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

### 🙏 **Acknowledgments**

- **Next.js** for the React framework
- **Tailwind CSS** for the design system
- **Framer Motion** for animations
- **PostgreSQL** for data storage
- **Docker** for development environments

---

**Built with ❤️ for democracy and transparency**
