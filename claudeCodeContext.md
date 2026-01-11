# Fractal - AI Campaign Orchestration Platform

## What is Fractal?
AI-powered marketing campaign orchestration that enables SMB e-commerce businesses ($5-50M revenue) to create coordinated, personalized content across multiple channels (email, SMS, Meta ads, Google ads) from a single input. Think "Mailchimp of campaign orchestration" - reducing campaign creation from days to hours while maintaining brand consistency.

**Core value proposition:** Segment × Channel = Exponential output. A campaign with 3 segments and 4 channels generates 12+ unique, personalized assets automatically.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 17+ (standalone components, signals) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas + Mongoose |
| AI | Claude API (claude-sonnet-4-20250514) |
| Auth | JWT + bcrypt |
| Styling | Tailwind CSS (dark theme, purple-to-indigo gradients) |

---

## Project Structure

```
fractal-mvp/
├── client/                    # Angular Frontend
│   └── src/app/
│       ├── core/              # Guards, interceptors, services
│       ├── shared/            # Shared components
│       └── features/
│           ├── auth/          # Login, register
│           ├── dashboard/     # Campaign overview
│           ├── campaigns/     # Campaign CRUD + wizard
│           ├── audiences/     # Segment management
│           └── brand/         # Brand guide management
│
├── server/                    # Express Backend
│   └── src/
│       ├── config/            # DB config, constants
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Auth, validation, errors
│       ├── models/            # Mongoose schemas
│       ├── routes/            # API routes
│       └── services/          # Business logic, AI generation
│
└── docker-compose.yml
```

---

## Data Architecture

### Five-Tier Hierarchy (Critical Concept)
```
Campaign → Segment → Channel → Channel Asset → Asset Version
```

Each level inherits context from parent and adds specificity:
- **Campaign**: Brand guide, objective, key messages, dates
- **Segment**: Audience targeting, propensity level, custom instructions
- **Channel**: Platform (email/meta/sms), purpose, frequency
- **Asset**: Content type (hero email, carousel ad), specifications
- **Version**: Strategy variation (conversion vs awareness focus)

### Core Models

**User** - Auth credentials, company info

**BrandGuide** (one per user)
- Voice attributes, tone guidelines
- Value proposition, key messages, phrases to avoid
- Target audience context, competitor context

**Audience** (segments)
- Demographics (age, income, location)
- Propensity level: "High" | "Medium" | "Low"
- Pain points, interests, key motivators

**Campaign**
- Links to brandGuideId
- segments[]: array of {audienceId, customInstructions}
- channels[]: array of {type, enabled, purpose}
- Status: "draft" | "generated" | "approved"

**Asset** (generated content)
- Links to campaignId, audienceId
- channelType, assetType
- versions[]: array of generated content variations

---

## API Endpoints

```
Auth:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me

Brand Guide:
  GET  /api/brand
  POST /api/brand
  PUT  /api/brand/:id

Audiences:
  GET    /api/audiences
  POST   /api/audiences
  PUT    /api/audiences/:id
  DELETE /api/audiences/:id

Campaigns:
  GET    /api/campaigns
  GET    /api/campaigns/:id
  POST   /api/campaigns
  PUT    /api/campaigns/:id
  DELETE /api/campaigns/:id
  POST   /api/campaigns/:id/generate    # AI content generation
  POST   /api/campaigns/:id/duplicate
  GET    /api/campaigns/:id/export

Assets:
  GET  /api/assets/:id
  PUT  /api/assets/:id
  POST /api/assets/:id/regenerate
```

---

## AI Content Generation

Generation flow in `server/src/services/generation.service.ts`:

1. Assembles context: brand guide + segment + campaign parameters
2. Builds channel-specific prompts (email vs Meta ad)
3. Calls Claude API with JSON output format
4. Creates Asset documents with multiple version strategies

**Email output**: subject, preheader, headline, body, cta
**Meta ad output**: primaryText (125 char), headline (40 char), description (125 char), ctaButton

Version strategies: CONVERSION, AWARENESS, URGENCY, EMOTIONAL

---

## UI/UX Conventions

**Theme**: Dark background (#0f0f0f), purple-to-indigo gradients
**Color coding by hierarchy level**:
- Campaign: purple/violet
- Segment: blue/cyan  
- Channel: green/teal
- Asset: orange/amber
- Version: pink/rose

**Campaign Wizard**: 5 steps
1. Basics (name, objective, dates)
2. Audience selection
3. Channel selection
4. Messaging (key messages, CTA)
5. Review & create

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fractal
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your-key
CLAUDE_MODEL=claude-sonnet-4-20250514
CLIENT_URL=http://localhost:4200
```

---

## Running Locally

**Docker (recommended)**:
```bash
docker-compose up -d
```

**Manual**:
```bash
# Backend
cd server && npm install && npm run dev

# Frontend  
cd client && npm install && npm start
```

App: http://localhost:4200 | API: http://localhost:3000

---

## Current MVP Scope

**In scope (MVP)**:
- Email and Meta Ads channels
- Brand guide creation
- Audience segment management
- Campaign creation wizard
- AI content generation
- Content review and editing
- JSON export

**Out of scope (future)**:
- Actual deployment to platforms (Klaviyo, Meta API)
- SMS and Google Ads channels
- CDP integration for 1:1 personalization
- Liquid templating output
- Analytics and reporting

---

## Key Business Context

**Target market**: SMB e-commerce ($5-50M revenue)
**Wedge**: Shopify ecosystem integration
**Competitive gap**: Existing tools (Klaviyo, Omnisend) lack true cross-channel orchestration - users manually coordinate across platforms

**Value demo**: Show multiplication effect
- 3 segments × 2 channels × 2 versions = 12 unique assets
- Traditional approach: hours per asset
- Fractal approach: minutes total

---

## Development Notes

### Adding a New Channel
1. Add channel type to `server/src/config/constants.ts`
2. Create content interface in `server/src/models/Asset.ts`
3. Add prompt builder in `server/src/services/generation.service.ts`
4. Update campaign wizard UI

### Important Files
- `server/src/services/generation.service.ts` - AI prompt engineering
- `server/src/config/constants.ts` - Enums and limits
- `client/src/app/features/campaigns/` - Campaign UI components
- `fractal-campaign-ui-v2.html` - Interactive prototype reference

### Styling
Use Tailwind utilities. Custom colors defined in tailwind.config.js:
- bg-bg-primary, bg-bg-card, bg-bg-input
- text-text-primary, text-text-secondary, text-text-muted
- Hierarchy colors: campaign, segment, channel, asset, version