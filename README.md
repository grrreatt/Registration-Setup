# Enterprise-Grade QR Check-in System

A comprehensive, secure, and scalable event registration and check-in system built with Next.js, Supabase, and modern web technologies.

## 🚀 Features

### Core Functionality
- **Event Registration**: Complete attendee registration with validation
- **QR Code Generation**: Automatic QR code generation for badges
- **QR Code Scanning**: Real-time QR code scanning for check-ins
- **Multi-type Check-ins**: Support for meal, kit, and general check-ins
- **Admin Dashboard**: Comprehensive analytics and management interface

### Enterprise Features
- **Security**: Rate limiting, input sanitization, CSRF protection
- **Performance**: Optimized database queries, caching, lazy loading
- **Monitoring**: Comprehensive logging and error tracking
- **Scalability**: Docker containerization, load balancing ready
- **Testing**: Complete test suite with Jest and Testing Library
- **Documentation**: API documentation and deployment guides

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **QR Codes**: qrcode, html5-qrcode
- **Testing**: Jest, Testing Library
- **Deployment**: Docker, Nginx

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Docker (for production deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd qr-checkin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment example file:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security Configuration
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Run the optimizations from `database-optimizations.sql`

### 5. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   ├── register/      # Registration endpoint
│   │   ├── checkin/       # Check-in endpoint
│   │   ├── events/        # Events management
│   │   ├── attendees/     # Attendees management
│   │   └── admin/         # Admin endpoints
│   ├── checkin/           # Check-in pages
│   ├── register/          # Registration pages
│   ├── admin/             # Admin dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── RegistrationForm.tsx
│   ├── CheckInForm.tsx
│   ├── QRCodeGenerator.tsx
│   ├── QRCodeScanner.tsx
│   ├── AdminDashboard.tsx
│   └── ErrorBoundary.tsx
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client
│   ├── supabaseAdmin.ts   # Admin Supabase client
│   ├── utils.ts           # Utility functions
│   ├── qr-code.ts         # QR code utilities
│   ├── rate-limit.ts      # Rate limiting
│   ├── validation.ts      # Input validation
│   └── logger.ts          # Logging utilities
└── types/                 # TypeScript type definitions
    └── index.ts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | Comma-separated allowed origins | No |
| `NEXTAUTH_SECRET` | NextAuth secret key | No |
| `REDIS_URL` | Redis URL for rate limiting | No |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENABLE_QR_SCANNING` | Enable QR code scanning | true |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics dashboard | true |
| `NEXT_PUBLIC_ENABLE_EXPORT` | Enable data export | true |

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Component Tests**: React component testing
- **E2E Tests**: Full user flow testing

## 🚀 Deployment

### Docker Deployment

1. **Build the Docker image**:

```bash
docker build -t qr-checkin .
```

2. **Run with Docker Compose**:

```bash
docker-compose up -d
```

3. **Configure SSL** (for production):

```bash
# Place your SSL certificates in ./ssl/
# cert.pem and key.pem
```

### Manual Deployment

1. **Build the application**:

```bash
npm run build
```

2. **Start the production server**:

```bash
npm start
```

### Environment-Specific Configuration

#### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
```

#### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com
```

## 📊 Monitoring and Logging

### Logging Levels

- **ERROR**: System errors and exceptions
- **WARN**: Warning conditions
- **INFO**: General information
- **DEBUG**: Detailed debugging information

### Performance Monitoring

The system includes built-in performance monitoring for:
- API response times
- Database query performance
- User action tracking
- Error rate monitoring

### Health Checks

- **Application Health**: `/api/health`
- **Database Health**: Automatic connection monitoring
- **External Services**: Supabase connectivity checks

## 🔒 Security Features

### Input Validation
- Server-side validation with Zod schemas
- Input sanitization and escaping
- SQL injection prevention
- XSS protection

### Rate Limiting
- API endpoint rate limiting
- Per-IP request limits
- Configurable rate limits per endpoint type

### Authentication & Authorization
- Supabase Row Level Security (RLS)
- Service role for admin operations
- Origin validation
- CSRF protection

### Data Protection
- Encrypted data transmission (HTTPS)
- Secure session management
- Audit logging for all operations
- Data retention policies

## 📈 Performance Optimization

### Database Optimizations
- Indexed queries for fast lookups
- Optimized joins and aggregations
- Connection pooling
- Query result caching

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization
- Static generation where possible
- Service worker for offline capability

### Caching Strategy
- Redis for session and rate limiting
- CDN for static assets
- Database query result caching
- Browser caching headers

## 🛠️ API Documentation

### Registration API

**POST** `/api/register`

Register a new attendee for an event.

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "event_id": "uuid",
  "category": "delegate",
  "institution": "University of Example",
  "meal_entitled": true,
  "kit_entitled": false,
  "notes": "Optional notes"
}
```

### Check-in API

**POST** `/api/checkin`

Check in an attendee for a specific type.

```json
{
  "badge_uid": "REG123456789",
  "check_in_type": "meal",
  "location": "Main Hall",
  "notes": "Optional notes"
}
```

**GET** `/api/checkin?badge_uid=REG123456789`

Get attendee information and check-in status.

### Admin APIs

**GET** `/api/admin/analytics`

Get system analytics and statistics.

**GET** `/api/admin/attendees`

Get attendees with filtering and pagination.

**PUT** `/api/admin/attendees?id=uuid`

Update attendee information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the [documentation](docs/)
2. Search existing [issues](issues/)
3. Create a new issue with detailed information
4. Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete registration and check-in system
- QR code generation and scanning
- Admin dashboard with analytics
- Comprehensive security features
- Docker deployment support
- Full test coverage

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Advanced user roles and permissions
- [ ] Integration with external systems
- [ ] Real-time notifications
- [ ] Advanced badge printing options

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.