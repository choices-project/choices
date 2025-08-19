# Choices Platform

A secure, modern voting platform with enterprise-grade biometric authentication, comprehensive security features, and full legal compliance.

## 🚀 Features

### Core Platform
- **Secure Voting**: Create and participate in polls with advanced security
- **Real-time Results**: Live voting results and analytics
- **User Management**: Comprehensive user account management
- **Admin Dashboard**: Advanced administrative tools and analytics

### Biometric Authentication
- **WebAuthn Support**: Industry-standard biometric authentication
- **Multi-device Support**: Fingerprint, Face ID, and other biometric methods
- **Trust Scoring**: Advanced trust assessment and verification
- **Audit Logging**: Comprehensive authentication audit trails
- **Security Monitoring**: Real-time security monitoring and alerts

### Security Features
- **Multi-layered Security**: Comprehensive security architecture
- **Rate Limiting**: Protection against spam and DDoS attacks
- **Content Filtering**: Advanced content validation and filtering
- **IP Intelligence**: Geographic and behavioral analysis
- **Encryption**: End-to-end encryption for all data

### Legal Compliance
- **GDPR Compliant**: Full European data protection compliance
- **CCPA Compliant**: California privacy law compliance
- **BIPA Compliant**: Illinois biometric privacy compliance
- **State Laws**: Compliance with various state privacy laws
- **Industry Standards**: ISO 27001, SOC 2, NIST compliance

## 🛡️ Security Architecture

### Biometric Authentication
- **WebAuthn Protocol**: Industry-standard implementation
- **Device Binding**: Credentials tied to specific devices
- **Challenge-Response**: Secure authentication protocols
- **Privacy by Design**: Biometric data never leaves user devices

### Data Protection
- **Encryption**: AES-256 encryption at rest and in transit
- **Access Controls**: Row-level security and role-based access
- **Audit Logging**: Comprehensive audit trails
- **Data Minimization**: Minimal data collection and storage

### Platform Security
- **Rate Limiting**: Protection against abuse and attacks
- **Content Validation**: Input validation and sanitization
- **Security Headers**: Comprehensive security headers
- **Monitoring**: Real-time security monitoring

## 📊 Trust System

### User Tiers
- **T0 (Anonymous)**: Basic access with limitations
- **T1 (Basic)**: Email-verified users
- **T2 (Verified)**: Biometric-authenticated users
- **T3 (Premium)**: High-trust verified users
- **T4 (Admin)**: Administrative access

### Trust Scoring
- **Biometric Trust**: Device consistency and authentication history
- **Behavioral Analysis**: Usage patterns and reliability
- **Geographic Consistency**: Location-based trust factors
- **Social Integration**: Enhanced trust through social verification

## 🏗️ Technical Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Query**: Data fetching and caching
- **Zustand**: State management

### Backend
- **Supabase**: Database and authentication
- **PostgreSQL**: Primary database
- **Row Level Security**: Database-level security
- **Real-time Subscriptions**: Live data updates

### Authentication
- **WebAuthn**: Biometric authentication standard
- **Supabase Auth**: Traditional authentication
- **Multi-factor**: Enhanced security options
- **Social Login**: OAuth integration

### Security
- **Vercel**: Secure hosting and CDN
- **Nginx**: Reverse proxy and rate limiting
- **Security Headers**: Comprehensive security headers
- **Monitoring**: Real-time security monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for authentication and database)

### ⚠️ **IMPORTANT: Email Bounce Protection**
This project uses Supabase's email service. To avoid email bounce issues:
- **Use real email addresses only** (no test@example.com)
- **Use OAuth for development testing** (Google/GitHub)
- **Check spam folder** for confirmation emails
- **Monitor Supabase dashboard** for email metrics

See `EMAIL_BOUNCE_WARNING.md` for detailed guidelines.
- Supabase account
- Modern browser with WebAuthn support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/choices-project/choices.git
   cd choices
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp web/.env.example web/.env.local
   # Edit web/.env.local with your Supabase credentials
   ```

4. **Set up database**
   ```bash
   node scripts/setup-biometric-schema.js
   ```

5. **Start development server**
   ```bash
   cd web
   npm run dev
   ```

6. **Access the platform**
   - Open http://localhost:3000
   - Create an account
   - Set up biometric authentication (optional)

## 📋 Legal Compliance

### Privacy Laws
- **GDPR**: European data protection compliance
- **CCPA**: California privacy law compliance
- **BIPA**: Illinois biometric privacy compliance
- **State Laws**: Various state privacy protections

### Security Standards
- **ISO 27001**: Information security management
- **SOC 2**: Security, availability, and confidentiality
- **NIST**: Cybersecurity framework compliance
- **OWASP**: Web application security standards

### User Rights
- **Data Access**: Right to access personal data
- **Data Portability**: Right to export data
- **Data Deletion**: Right to delete data
- **Consent Management**: Granular consent control

## 🔧 Configuration

### Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# GitHub Integration
GITHUB_TOKEN=your_github_token
GITHUB_REPO=your_github_repo
```

### Database Setup
```bash
# Run database setup scripts
node scripts/setup-biometric-schema.js
node scripts/security-database-setup.js
```

## 📚 Documentation

### User Guides
- [Getting Started](docs/GETTING_STARTED.md)
- [Biometric Authentication](docs/BIOMETRIC_AUTHENTICATION.md)
- [Security Features](docs/SECURITY_ENHANCEMENT.md)
- [Admin Dashboard](docs/ADMIN_DASHBOARD.md)

### Legal Documentation
- [Privacy Policy](docs/PRIVACY_POLICY.md)
- [Terms of Service](docs/TERMS_OF_SERVICE.md)
- [Legal Compliance](docs/LEGAL_COMPLIANCE.md)

### Technical Documentation
- [API Reference](docs/API_REFERENCE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Security Architecture](docs/SECURITY_ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

### Security
- **Security Review**: All changes reviewed for security
- **Vulnerability Reporting**: Report security issues privately
- **Code Audit**: Regular security audits
- **Penetration Testing**: Periodic penetration testing

## 📄 License

This project is licensed under the MIT License with additional terms for biometric authentication. See [LICENSE](LICENSE) for details.

### License Terms
- **MIT License**: Open source software license
- **Biometric Terms**: Additional terms for biometric features
- **Commercial Use**: Appropriate for commercial applications
- **Legal Compliance**: Must comply with applicable laws

## 🆘 Support

### Documentation
- [User Guide](docs/USER_GUIDE.md)
- [FAQ](docs/FAQ.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### Contact
- **Support**: support@choices-platform.com
- **Security**: security@choices-platform.com
- **Legal**: legal@choices-platform.com
- **Privacy**: privacy@choices-platform.com

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community discussions and questions
- **Discord**: Real-time community support

## 🏆 Acknowledgments

### Open Source
- **WebAuthn**: Web Authentication standard
- **Supabase**: Database and authentication platform
- **Next.js**: React framework
- **Tailwind CSS**: Utility-first CSS framework

### Security
- **OWASP**: Web application security standards
- **NIST**: Cybersecurity framework
- **ISO**: Information security standards

### Legal
- **Privacy Laws**: GDPR, CCPA, BIPA compliance
- **Industry Standards**: Security and privacy best practices

---

**Built with ❤️ for secure, accessible, and compliant voting**
