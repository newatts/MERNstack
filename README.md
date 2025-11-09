# MERN Platform - Full-Stack Application

A comprehensive MERN (MongoDB, Express, React, Node.js) platform designed as a reusable backbone for multiple applications. This system supports multiple admin levels, flexible group management, real-time chat, file upload/processing, AI-assisted workflows, IoT device integration, and billing/usage tracking.

## Features

### MVP (Current Implementation)

- ✅ **Authentication System**
  - JWT-based authentication with access and refresh tokens
  - Email verification flow
  - Password reset functionality
  - Multi-factor authentication support (framework in place)

- ✅ **Role-Based Access Control (RBAC)**
  - Fine-grained permission system
  - Multiple role levels: Super Admin, Admin, Regional Admin, Local Admin, Group Admin, Member, Student, Service Account
  - Extensible permission model

- ✅ **User Management**
  - User profile CRUD operations
  - Avatar support
  - User preferences

- ✅ **Groups & Membership**
  - Create and manage groups
  - Nested groups/subgroups support
  - Group admin capabilities
  - Member invitations via email
  - Flexible membership management

- ✅ **Real-Time Chat**
  - One-on-one messaging
  - Group chat
  - WebSocket-based real-time communication
  - Typing indicators
  - Read receipts
  - Message history

- ✅ **File Upload & Management**
  - S3-compatible storage integration
  - Presigned URL uploads
  - File metadata tracking
  - Access control per file

- ✅ **Assignment & Submission System**
  - Teachers can create assignments
  - Students can submit work
  - AI grading integration (stubbed for Phase 2)
  - Grade release scheduling

- ✅ **Billing Integration**
  - Stripe integration
  - Subscription management
  - Usage tracking
  - Multiple billing models support

### Future Phases

- 🔄 **IoT Device Integration**
- 🔄 **Web Scraper Module**
- 🔄 **SMS/Texting Service**
- 🔄 **Email Automation (Outlook)**
- 🔄 **AI Grading Workers**
- 🔄 **Advanced Analytics**

## Tech Stack

### Backend

- **Node.js** v18+
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **AWS SDK** - S3 file storage
- **Stripe** - Payment processing
- **Bull** - Job queue (ready for AI workers)
- **Redis** - Caching and queue backend

### Frontend

- **React** 18
- **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time client
- **React Hook Form** - Form handling
- **Zod** - Validation
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Project Structure

```
MERNstack/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── socket/        # Socket.IO setup
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── .env.example       # Environment variables template
│   └── package.json
│
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/          # Libraries (API, socket)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # State management
│   │   └── types/        # TypeScript types
│   ├── .env.example      # Environment variables template
│   └── package.json
│
└── package.json          # Root package.json
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Running locally or MongoDB Atlas account
- **Redis** (v6 or higher) - For job queue and caching
- **npm** or **yarn**
- **AWS S3** account (or S3-compatible storage)
- **Stripe** account (for billing features)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MERNstack
```

### 2. Install Dependencies

Install root dependencies:

```bash
npm install
```

Install server dependencies:

```bash
cd server
npm install
cd ..
```

Install client dependencies:

```bash
cd client
npm install
cd ..
```

### 3. Configure Environment Variables

#### Server Configuration

Create `server/.env` from the example:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mern-platform

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@mernplatform.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=mern-platform-files

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Client Configuration

Create `client/.env`:

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

### 4. Start Services

#### Start MongoDB

If running locally:

```bash
mongod
```

Or use MongoDB Atlas cloud service.

#### Start Redis

```bash
redis-server
```

### 5. Run the Application

#### Development Mode (Recommended)

From the root directory, run both server and client concurrently:

```bash
npm run dev
```

Or run them separately:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

#### Production Mode

Build both applications:

```bash
npm run build
```

Start the server:

```bash
cd server
npm start
```

The client build files will be in `client/dist` and can be served by any static file server.

### 6. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## Usage

### Creating Your First Account

1. Navigate to http://localhost:5173
2. Click "Sign up" to create a new account
3. Fill in the registration form
4. Check your email for verification link
5. Click the verification link
6. Log in with your credentials

### User Roles

The platform supports multiple user roles with different permission levels:

- **SUPER_ADMIN**: Full system access, billing control, manage all tenants
- **ADMIN**: Manage regions, configure modules, view reports
- **REGIONAL_ADMIN**: Manage data/users for a geographic region
- **LOCAL_ADMIN**: Manage local sites and settings
- **GROUP_ADMIN**: Create and manage groups, invite members
- **MEMBER**: Standard user with group access
- **STUDENT**: Submit assignments, access resources
- **SERVICE_ACCOUNT**: For devices and third-party integrations

### Creating Groups

1. Log in and navigate to "Groups"
2. Click "Create Group"
3. Enter group name and description
4. Click "Create"
5. Invite members via email

### Using Chat

1. Navigate to "Chat"
2. Select a conversation or start a new one
3. Type your message and press Enter or click Send
4. Messages appear in real-time

## API Documentation

### Authentication Endpoints

```
POST /api/auth/signup          - Register new user
POST /api/auth/login           - Login
POST /api/auth/verify-email    - Verify email
POST /api/auth/refresh         - Refresh access token
POST /api/auth/request-password-reset - Request password reset
POST /api/auth/reset-password  - Reset password
GET  /api/auth/me             - Get current user
```

### User Endpoints

```
GET    /api/users             - List users (admin)
GET    /api/users/:id         - Get user profile
PATCH  /api/users/:id         - Update user profile
DELETE /api/users/:id         - Delete user (admin)
```

### Group Endpoints

```
GET    /api/groups            - List user's groups
POST   /api/groups            - Create group
GET    /api/groups/:id        - Get group details
PATCH  /api/groups/:id        - Update group
DELETE /api/groups/:id        - Delete group
POST   /api/groups/:id/members - Add member
DELETE /api/groups/:id/members - Remove member
POST   /api/groups/:id/invite - Invite members
GET    /api/groups/:id/subgroups - Get subgroups
```

### Message Endpoints

```
GET    /api/messages          - Get messages
POST   /api/messages          - Send message
GET    /api/messages/conversations - Get conversations
PATCH  /api/messages/:id/read - Mark as read
DELETE /api/messages/:id      - Delete message
```

### File Endpoints

```
POST   /api/files/upload-url  - Get upload URL
POST   /api/files/:id/confirm - Confirm upload
GET    /api/files/:id/download - Get download URL
GET    /api/files             - List files
DELETE /api/files/:id         - Delete file
```

### Assignment Endpoints

```
GET    /api/assignments       - List assignments
POST   /api/assignments       - Create assignment
GET    /api/assignments/:id   - Get assignment
POST   /api/assignments/:id/submit - Submit assignment
GET    /api/assignments/submissions/:id - Get submission
POST   /api/assignments/submissions/:id/grade - Grade submission
```

### Billing Endpoints

```
GET    /api/billing/account   - Get billing account
POST   /api/billing/stripe-customer - Create Stripe customer
POST   /api/billing/payment-method - Add payment method
GET    /api/billing/usage     - Get usage records
POST   /api/billing/usage     - Record usage
POST   /api/billing/subscription - Create subscription
```

## Testing

### Manual Testing Checklist

- [ ] User registration and email verification
- [ ] User login and token refresh
- [ ] Profile update
- [ ] Group creation and management
- [ ] Group member invitation
- [ ] Real-time chat messaging
- [ ] File upload and download
- [ ] Assignment creation and submission
- [ ] Billing account setup

## Security Considerations

### Production Deployment

Before deploying to production:

1. **Change all secrets** in `.env` files
2. **Enable HTTPS** on both frontend and backend
3. **Set secure cookies** for sensitive data
4. **Configure CORS** properly for your domain
5. **Set up rate limiting** (already configured)
6. **Enable MongoDB authentication**
7. **Secure Redis** with password
8. **Use environment-specific configurations**
9. **Set up monitoring and logging**
10. **Enable database backups**

### Best Practices

- Never commit `.env` files
- Use strong JWT secrets (min 32 characters)
- Rotate secrets regularly
- Implement proper error handling
- Validate all user inputs
- Sanitize data before database operations
- Use HTTPS in production
- Implement proper logging and monitoring

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG

# Start Redis
redis-server
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Email Not Sending

1. Check email credentials in `.env`
2. For Gmail, use App Password instead of regular password
3. Enable "Less secure app access" or use OAuth2

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review API endpoints above

## Roadmap

### Phase 2 (Planned)

- [ ] IoT device integration and dashboard
- [ ] Web scraper module with job scheduling
- [ ] SMS/texting service integration
- [ ] Email automation with Outlook
- [ ] AI grading workers with BullMQ
- [ ] Advanced analytics dashboard
- [ ] Multi-tenancy support
- [ ] Admin dashboard for super admins
- [ ] Data export and reporting
- [ ] Advanced file processing pipeline

### Phase 3 (Future)

- [ ] Mobile apps (React Native)
- [ ] Plugin/module system
- [ ] Marketplace for extensions
- [ ] Advanced AI features
- [ ] Video/audio chat
- [ ] Calendar integration
- [ ] Advanced notification system
- [ ] Workflow automation

## Architecture Notes

### Scalability

The platform is designed for scalability:

- **Stateless backend** - Can run multiple instances behind load balancer
- **MongoDB replica sets** - For high availability
- **Redis** - For caching and session management
- **S3** - For distributed file storage
- **Socket.IO with Redis adapter** - For scaling real-time features

### Extensibility

The platform is built to be extensible:

- **Modular architecture** - Easy to add new features
- **Plugin-ready** - Service layer pattern for easy integration
- **RBAC system** - Flexible permission model
- **Multi-tenant ready** - Logical data separation

## Acknowledgments

Built with modern web technologies and best practices for enterprise-grade applications.
