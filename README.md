# Portfolio CMS - Dynamic Portfolio & Content Management System

A comprehensive, full-stack portfolio website and content management system built with Next.js, featuring a professional public portfolio and a powerful admin console for content management.

## 🚀 Features

### Public Portfolio
- **Responsive Design**: Mobile-first, dark-themed professional portfolio
- **Server-Side Rendering**: Optimized for SEO and performance
- **Dynamic Content**: Real-time updates from the admin console
- **Blog System**: Markdown-based blog with automatic LinkedIn sharing
- **Contact Form**: Integrated contact form with admin notifications

### Admin Console
- **React-Admin Interface**: Professional CMS with full CRUD operations
- **Authentication**: Secure JWT-based authentication with refresh tokens
- **Content Management**: Manage portfolio content, blog posts, and contact submissions
- **LinkedIn Integration**: OAuth 2.0 integration for automatic post sharing
- **Change Tracking**: Comprehensive audit logs with automatic cleanup

### Technical Excellence
- **Test-Driven Development**: 80%+ test coverage with comprehensive test suite
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized for Vercel's edge network
- **Security**: Industry-standard security practices and authentication

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Admin UI**: React-Admin with Material-UI
- **Testing**: Jest, React Testing Library, Cypress, MSW
- **Deployment**: Vercel with automatic CI/CD
- **State Management**: Zustand, TanStack Query

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Vercel account (for deployment)
- LinkedIn Developer App (for social sharing)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd portfolio-cms
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your configuration:

```env
# Database
MONGODB_URI=your-mongodb-connection-string

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# LinkedIn API (optional)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Development

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Open Cypress for E2E testing
npm run cypress:open
```

Visit:
- **Public Portfolio**: http://localhost:3000
- **Admin Console**: http://localhost:3000/admin

## 🧪 Testing

This project follows comprehensive Test-Driven Development practices:

### Test Commands

```bash
# Unit tests
npm run test
npm run test:watch
npm run test:coverage

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
npm run test:e2e:open

# Run all tests
npm run test:all

# Validation (type-check + lint + test)
npm run validate
```

### Test Coverage

- **Target**: 80%+ coverage for lines, functions, branches, statements
- **Critical Paths**: 95%+ coverage for authentication and data persistence
- **Test Types**: Unit, Integration, and End-to-End tests

See [TDD_GUIDE.md](./TDD_GUIDE.md) for comprehensive testing documentation.

## 📁 Project Structure

```
portfolio-cms/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin console pages
│   │   └── (public)/       # Public portfolio pages
│   ├── components/         # Reusable components
│   ├── lib/               # Utility functions and configurations
│   └── __mocks__/         # Mock Service Worker setup
├── cypress/               # E2E tests
├── __tests__/            # Integration tests
├── .github/workflows/    # CI/CD configuration
└── docs/                 # Documentation
```

## 🔧 Development Workflow

### 1. Test-Driven Development

Follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

### 2. Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Formatting
npx prettier --write .
```

### 3. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes with tests
npm run validate

# Commit changes
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add production environment variables
3. **Deploy**: Automatic deployment on push to main branch

### Environment Variables for Production

```env
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
NEXTAUTH_URL=https://yourdomain.com
```

### CI/CD Pipeline

The project includes GitHub Actions for:
- **Testing**: Unit, integration, and E2E tests
- **Security**: Dependency auditing and vulnerability scanning
- **Quality**: Linting, type checking, and code formatting
- **Deployment**: Automatic deployment to Vercel

## 📖 API Documentation

### Public Endpoints

- `GET /api/portfolio/content` - Get portfolio content
- `GET /api/portfolio/blog` - Get published blog posts
- `GET /api/portfolio/blog/[slug]` - Get specific blog post
- `POST /api/portfolio/contact` - Submit contact form

### Admin Endpoints (Protected)

- `POST /api/auth/login` - Admin authentication
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/admin/content` - Get portfolio content for editing
- `PUT /api/admin/content` - Update portfolio content
- `GET /api/admin/blog` - Get all blog posts (including drafts)
- `POST /api/admin/blog` - Create new blog post
- `PUT /api/admin/blog/[id]` - Update blog post
- `DELETE /api/admin/blog/[id]` - Delete blog post

## 🔒 Security

- **Authentication**: JWT with secure refresh token rotation
- **Authorization**: Role-based access control
- **Data Validation**: Comprehensive input validation and sanitization
- **Security Headers**: Implemented via Next.js middleware
- **Environment Variables**: Secure configuration management
- **Dependency Scanning**: Automated vulnerability detection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Implement your feature
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [TDD_GUIDE.md](./TDD_GUIDE.md) for testing documentation
- Review the [API documentation](#api-documentation) for endpoint details
