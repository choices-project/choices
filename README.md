# 🗳️ Choices - Privacy-First Voting Platform

A revolutionary privacy-first voting platform built as a Progressive Web App (PWA) that combines advanced encryption, differential privacy, and zero-knowledge proofs to ensure secure, anonymous, and verifiable voting experiences across all devices.

## 🚀 Quick Start for New Contributors

### **For New Agents/Contributors**
1. **📚 Documentation System**: Start with [`docs/consolidated/README.md`](docs/consolidated/README.md)
2. **👋 Onboarding Guide**: Read [`docs/consolidated/development/AGENT_ONBOARDING.md`](docs/consolidated/development/AGENT_ONBOARDING.md)
3. **🏗️ Architecture**: Review [`docs/consolidated/core/ARCHITECTURE.md`](docs/consolidated/core/ARCHITECTURE.md)
4. **🛠️ Development**: Study [`docs/consolidated/development/DEVELOPMENT_GUIDE.md`](docs/consolidated/development/DEVELOPMENT_GUIDE.md)
5. **🔍 Quick Assessment**: Run `node scripts/assess-project-status.js`

### **Current Project Status**
- ✅ **Core Application**: Next.js frontend with Go backend services
- ✅ **Database**: PostgreSQL via Supabase with comprehensive RLS security
- ✅ **Authentication**: Supabase Auth with tiered user system
- ✅ **Automated Polls**: MVP feature for trending topic analysis
- ⚠️ **Security Policies**: Need final deployment (see deployment guide)

### **Quick Development Setup**
```bash
# Clone and setup
git clone https://github.com/choices-project/choices.git
cd choices

# Start development server
cd web && npm install && npm run dev

# Check database status
node scripts/check_supabase_auth.js

# Follow deployment guide for database setup
# See FINAL_DEPLOYMENT_INSTRUCTIONS.md
```

## 🚀 Features

### 🔐 Advanced Privacy & Security
- **AES-256 Encryption**: End-to-end encryption for all data transmission and storage
- **Differential Privacy**: Laplace and Gaussian mechanisms with privacy budget management
- **Zero-Knowledge Proofs**: Age verification, vote validation, and range proofs
- **WebAuthn Integration**: Biometric and hardware-based authentication
- **Device Fingerprinting**: Advanced bot detection and trust tier management
- **Local Storage Encryption**: Client-side data encryption with secure key management

### 📱 Progressive Web App (PWA)
- **Offline Voting**: Complete offline functionality with background sync
- **Push Notifications**: Real-time updates and engagement
- **App Installation**: Native app-like experience - add to home screen
- **Service Worker**: Intelligent caching and offline capabilities
- **Background Sync**: Automatic data synchronization when online
- **Cross-Platform**: Works seamlessly on mobile, tablet, and desktop

### 🌐 Universal Compatibility
- **Responsive Design**: Optimized for all screen sizes
- **Touch Interface**: Gesture recognition and touch target optimization
- **Browser Compatibility**: Works across all modern browsers
- **Accessibility**: WCAG compliant with screen reader support
- **Performance**: Optimized for low-end devices and slow connections

### 🧪 Comprehensive Testing Suite
- **MVP Testing**: Core functionality, security, and performance validation
- **Cross-Platform Testing**: Comprehensive testing across all devices
- **PWA Testing**: Progressive web app feature validation
- **Real-time Testing**: Live test execution with detailed reporting
- **Deployment Readiness**: Complete validation for production deployment

### 🤖 Automated Polls Feature (MVP)
- **Trending Topics Analysis**: Automated scanning of current events
- **Poll Generation**: AI-powered poll creation with context awareness
- **Admin Dashboard**: Comprehensive admin interface for poll management
- **Security-First**: Complete data isolation and privacy protection

## 🔒 Privacy & Encryption Techniques

### AES-256 Encryption
- **End-to-End Encryption**: All data is encrypted in transit and at rest
- **Client-Side Encryption**: Data is encrypted before leaving the user's device
- **Secure Key Management**: Cryptographic keys are securely generated and stored
- **Local Storage Security**: Sensitive data is encrypted before local storage

### Differential Privacy
- **Laplace Mechanism**: Adds calibrated noise to numerical data
- **Gaussian Mechanism**: Provides privacy guarantees for statistical queries
- **Privacy Budget Management**: Tracks and limits privacy loss across queries
- **Epsilon-Delta Privacy**: Configurable privacy parameters (ε, δ)

### Zero-Knowledge Proofs (ZKPs)
- **Age Verification**: Prove age without revealing exact date of birth
- **Vote Validation**: Verify vote integrity without revealing vote content
- **Range Proofs**: Prove values fall within specified ranges
- **Non-Interactive ZKPs**: Efficient proof generation and verification

### Advanced Authentication
- **WebAuthn Integration**: Biometric and hardware-based authentication
- **Device Fingerprinting**: Advanced bot detection and device verification
- **Trust Tiers**: Multi-level trust scoring based on device characteristics
- **Session Management**: Secure session handling with automatic expiration

## 🛠️ Technology Stack

### Frontend (PWA)
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icon library

### Backend
- **PostgreSQL**: Robust relational database (via Supabase)
- **Prisma**: Type-safe database client
- **Next.js API Routes**: Serverless API endpoints
- **WebAuthn**: Web Authentication API

### Privacy & Security
- **Web Crypto API**: Cryptographic operations
- **IndexedDB**: Client-side encrypted storage
- **Service Workers**: Offline capabilities and caching
- **Push API**: Real-time notifications

### Infrastructure
- **Vercel**: Production deployment and hosting
- **Supabase**: Database and authentication
- **GitHub Actions**: CI/CD pipeline

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/choices-project/choices.git
   cd choices
   ```

2. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secure-random-string-here"
   NEXTAUTH_URL="http://localhost:3000"
   SUPABASE_URL="your-supabase-url"
   SUPABASE_ANON_KEY="your-supabase-anon-key-here"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Progressive Web App Features

### Offline Capabilities
- **Complete Offline Voting**: Vote without internet connection
- **Background Sync**: Automatic synchronization when online
- **Intelligent Caching**: Smart resource caching for performance
- **Offline Indicators**: Clear offline/online status

### App-Like Experience
- **Install Prompt**: Add to home screen functionality
- **Push Notifications**: Real-time updates and engagement
- **Native Feel**: Smooth animations and transitions
- **Full-Screen Mode**: Immersive voting experience

### Performance Optimization
- **Lazy Loading**: Efficient resource loading
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Efficient bundle splitting
- **Service Worker**: Intelligent caching strategies

## 🧪 Testing

### Comprehensive Testing Suite
Visit `/comprehensive-testing` to run the complete testing suite:

- **MVP Testing**: Core functionality and security validation
- **Cross-Platform Testing**: Comprehensive testing across all devices
- **PWA Testing**: Progressive web app feature validation
- **Deployment Readiness**: Complete production validation

### Individual Testing Pages
- **MVP Testing**: `/mvp-testing` - Core functionality validation
- **Cross-Platform Testing**: `/cross-platform-testing` - Platform compatibility
- **PWA Testing**: `/pwa-testing` - Progressive web app features

### Running Tests
```bash
# Build the application
npm run build

# Run comprehensive tests
npm run test

# Check for TypeScript errors
npm run type-check
```

## 🔒 Security & Privacy Features

### Encryption Implementation
```typescript
// AES-256 encryption for sensitive data
const encryptedData = await encryptData(sensitiveData, userKey);

// Differential privacy for statistical queries
const privateResult = applyDifferentialPrivacy(rawData, epsilon, delta);

// Zero-knowledge proof for age verification
const ageProof = generateAgeProof(userAge, minimumAge);
```

### Privacy Budget Management
- **Epsilon Tracking**: Monitor privacy loss across queries
- **Budget Allocation**: Distribute privacy budget efficiently
- **Threshold Enforcement**: Prevent excessive privacy loss
- **Audit Trail**: Complete privacy budget audit trail

### Data Protection
- **Client-Side Encryption**: Data encrypted before transmission
- **Secure Storage**: Encrypted local storage with key management
- **Data Minimization**: Minimal data collection and retention
- **User Control**: Complete user control over data sharing

## 🌐 Cross-Platform Compatibility

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Enhanced tablet experience
- **Desktop Optimization**: Full desktop functionality
- **Touch Interface**: Gesture recognition and touch targets

### Browser Support
- **Chrome**: Full feature support
- **Firefox**: Complete compatibility
- **Safari**: Full PWA support
- **Edge**: Complete feature set

### Accessibility
- **Screen Reader Support**: Full NVDA/JAWS compatibility
- **Keyboard Navigation**: Complete keyboard accessibility
- **Color Contrast**: WCAG AA compliance
- **Focus Management**: Proper focus handling

## 📊 Performance Metrics

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### PWA Performance
- **Load Time**: < 3s on 3G connections
- **Memory Usage**: Optimized for low-end devices
- **Battery Efficiency**: Minimal battery impact
- **Offline Performance**: Complete offline functionality

## 🚀 Deployment

### Production Build
```bash
# Create production build
npm run build

# Start production server
npm start
```

### Environment Configuration
```env
# Production environment variables
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secure-random-string-here"
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key-here"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key-here"
```

### Deployment Checklist
- ✅ Core functionality tests passing
- ✅ Security and privacy features validated
- ✅ Performance benchmarks met
- ✅ Accessibility requirements satisfied
- ✅ Cross-platform compatibility verified
- ✅ PWA features working correctly
- ✅ Service worker properly configured

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Testing Requirements
- All new features must include comprehensive tests
- Cross-platform compatibility must be validated
- Performance impact must be assessed
- Security implications must be reviewed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **🌐 Live Platform**: [https://choices-platform.vercel.app](https://choices-platform.vercel.app)
- **📊 Admin Dashboard**: [https://choices-platform.vercel.app/admin](https://choices-platform.vercel.app/admin)
- **📚 Project Summary**: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Comprehensive feature overview
- **📖 Documentation**: [docs/consolidated/README.md](docs/consolidated/README.md) - Technical documentation
- **🐛 Issues**: [https://github.com/choices-project/choices/issues](https://github.com/choices-project/choices/issues)
- **💬 Discussions**: [https://github.com/choices-project/choices/discussions](https://github.com/choices-project/choices/discussions)

## 🙏 Acknowledgments

- **Privacy Research**: Based on cutting-edge privacy research
- **Open Source**: Built with amazing open-source tools
- **Community**: Thanks to our amazing community contributors
- **Research Partners**: Collaboration with privacy research institutions

---

**Built with ❤️ for a more private and secure voting experience**

*Available as a Progressive Web App - works on all devices without app store installation*
