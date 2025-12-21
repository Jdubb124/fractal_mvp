# Fractal MVP

AI-powered campaign orchestration platform for creating personalized marketing content across Email and Meta Ads channels.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ (or Docker)
- Anthropic API Key

### Option 1: Docker (Recommended)

```bash
# Clone and navigate to project
cd fractal-mvp

# Create environment file
cp server/.env.example server/.env
# Edit .env and add your ANTHROPIC_API_KEY

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the app at http://localhost:4200

### Option 2: Manual Setup

#### Backend (Express API)

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Server runs at http://localhost:3000

#### Frontend (Angular)

```bash
cd client

# Install dependencies
npm install

# Start development server
npm start
```

App runs at http://localhost:4200

## 📁 Project Structure

```
fractal-mvp/
├── client/                 # Angular 17+ Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Services, guards, interceptors
│   │   │   ├── shared/     # Shared components
│   │   │   └── features/   # Feature modules
│   │   │       ├── auth/
│   │   │       ├── dashboard/
│   │   │       ├── campaigns/
│   │   │       ├── audiences/
│   │   │       └── brand/
│   │   └── environments/
│   └── tailwind.config.js
│
├── server/                 # Express + TypeScript Backend
│   ├── src/
│   │   ├── config/         # Database, constants
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic, AI integration
│   └── server.ts
│
└── docker-compose.yml
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Brand Guide
- `GET /api/brand` - Get user's brand guide
- `POST /api/brand` - Create brand guide
- `PUT /api/brand/:id` - Update brand guide

### Audiences
- `GET /api/audiences` - List all audiences
- `POST /api/audiences` - Create audience
- `PUT /api/audiences/:id` - Update audience
- `DELETE /api/audiences/:id` - Delete audience

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign with assets
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/generate` - Generate AI content
- `GET /api/campaigns/:id/export` - Export campaign

### Assets
- `GET /api/assets/:id` - Get asset
- `PUT /api/assets/:id` - Update asset
- `POST /api/assets/:id/regenerate` - Regenerate with AI

## 🔧 Environment Variables

### Server (.env)

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fractal
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your-anthropic-api-key
CLAUDE_MODEL=claude-sonnet-4-20250514
CLIENT_URL=http://localhost:4200
```

## 🎨 Features

- **Brand Guide**: Define your brand voice, tone, and messaging guidelines
- **Audience Segments**: Create and manage target audience profiles
- **Campaign Creation**: Multi-step wizard to set up campaigns
- **AI Generation**: Generate personalized content using Claude API
- **Multi-Channel**: Support for Email and Meta Ads
- **Content Versions**: Multiple AI-generated versions per asset
- **Export**: Download campaign content as JSON

## 🏗 Tech Stack

- **Frontend**: Angular 17, Tailwind CSS, RxJS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB, Mongoose
- **AI**: Anthropic Claude API
- **Auth**: JWT, bcrypt

## 📝 Development Notes

### Adding a New Channel

1. Add channel type to `server/src/config/constants.ts`
2. Create content interface in `server/src/models/Asset.ts`
3. Add prompt builder in `server/src/services/generation.service.ts`
4. Update campaign wizard and detail components

### Customizing AI Prompts

Edit `server/src/services/generation.service.ts`:
- `buildEmailPrompt()` for email content
- `buildMetaAdPrompt()` for Meta ad content

## 📄 License

MIT