# StockbotX - AI-Powered Stock Market Analysis Platform

## Overview

StockbotX is a comprehensive full-stack web application that provides AI-powered stock market analysis and trading insights. The platform combines real-time financial data with artificial intelligence to deliver personalized investment recommendations, emotional trading awareness, and interactive chat-based analysis.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL (Neon Database)
- **ORM**: Drizzle ORM with type-safe queries
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless with WebSocket support

## Key Components

### AI Integration
- **Service**: Google Gemini AI (Gemini 2.5 Flash model)
- **Capabilities**: 
  - Financial advice generation
  - Sentiment analysis
  - Market trend analysis
  - Risk assessment recommendations
- **Context**: Conversation history and market data awareness

### Authentication System
- **Provider**: Replit Auth with OIDC
- **Features**: 
  - Automatic user creation
  - Session persistence
  - Profile management
  - Secure logout handling

### Stock Market Data
- **Provider**: Alpha Vantage API
- **Data Types**:
  - Real-time stock quotes
  - Historical price data
  - Market indicators
  - Company fundamentals

### Chat System
- **Features**:
  - Persistent conversations
  - Message history
  - Real-time AI responses
  - Context-aware recommendations

### UI/UX Design
- **Theme**: Dark mode with blue accent colors
- **Components**: Comprehensive shadcn/ui component library
- **Responsiveness**: Mobile-first responsive design
- **Accessibility**: ARIA compliant components

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth OIDC flow
2. **Session Management**: Sessions stored in PostgreSQL with automatic cleanup
3. **Stock Data Retrieval**: Real-time data fetched from Alpha Vantage API
4. **AI Processing**: User queries processed through Gemini AI with financial context
5. **Data Persistence**: Conversations, messages, and user preferences stored in database
6. **Real-time Updates**: Client-side state management via React Query with optimistic updates

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Gemini AI**: AI-powered financial analysis
- **Alpha Vantage**: Stock market data provider
- **Replit Auth**: Authentication and user management

### Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Backend bundling for production

### Key Libraries
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **@radix-ui**: Accessible UI primitives
- **wouter**: Lightweight routing
- **zod**: Runtime type validation

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with hot reloading
- **Database**: Direct connection to Neon Database
- **Environment**: Replit-optimized with cartographer plugin

### Production Build
- **Frontend**: Static files built to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Assets**: Served via Express static middleware
- **Optimization**: Tree shaking and code splitting

### Environment Configuration
- **Database**: `DATABASE_URL` for Neon connection
- **AI Service**: `GEMINI_API_KEY` for Google AI
- **Stock Data**: `ALPHA_VANTAGE_API_KEY` for market data
- **Auth**: Replit-provided OIDC configuration
- **Sessions**: `SESSION_SECRET` for secure session management

## Changelog

```
Changelog:
- June 28, 2025: Initial setup and architecture
- June 28, 2025: Complete StockbotX implementation with:
  * Replit Auth integration (login/logout)
  * Real-time stock market data via Alpha Vantage API
  * AI-powered chatbot using Gemini API
  * 10-year historical stock analysis with interactive charts
  * Emotional-aware trading sentiment analysis
  * 4-option analysis system (Technical, Fundamental, Sentiment, Emotional)
  * PostgreSQL database with full CRUD operations
  * Responsive dashboard with real-time market data
  * Dark theme UI with professional financial styling
- June 28, 2025: Application rebranded from ChatbotX to StockbotX
  * Updated all UI components and branding
  * Modified page titles and metadata
  * Updated documentation and project references
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```