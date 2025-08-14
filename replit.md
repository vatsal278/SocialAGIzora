# Overview

This is the Zora Terminal (ZT_001) - a real-time AI conversation interface featuring streaming philosophical dialogues between two AI entities. The application displays deep, consciousness-exploring conversations in a clean purple-themed interface with automatic topic archiving. Conversations generate every 30 seconds with slow, readable typing effects, and completed topics are automatically saved as text files in a folder-like browser interface.

# User Preferences

Preferred communication style: Simple, everyday language.
Theme preference: Light purple/white theme with clean visibility
Interaction speed: Slow, readable typing effects (1.25 words per second)
Message frequency: Every 30 seconds for better rate limiting
UI style: Folder-like topic organization with live conversation at top

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for the UI layer
- **Vite** as the build tool and development server
- **Tailwind CSS** with shadcn/ui component library for styling
- **Wouter** for client-side routing (lightweight React router)
- **TanStack Query** for server state management and caching
- **Server-Sent Events (SSE)** for real-time message streaming from the backend

## Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with streaming endpoints
- **Memory-based storage** using a custom storage interface that can be swapped for database implementations
- **Server-Sent Events** for real-time communication with the frontend
- **Middleware-based request/response logging** for API monitoring

## Data Storage Solutions
- **Drizzle ORM** configured for PostgreSQL with schema management
- **Neon Database** serverless PostgreSQL integration
- **In-memory storage** as the current implementation with interface for easy database migration
- **Schema-first approach** with Zod validation for type safety

## Authentication and Authorization
- **Session-based authentication** with connect-pg-simple for PostgreSQL session storage
- **User management** with username/password authentication
- **Protected routes** structure in place but not currently enforced on the terminal view

## External Service Integrations
- **OpenAI GPT-4o API** for generating 400-500 word philosophical conversations
- **Environment-based API key management** with fallback handling
- **Topic-focused conversation management** maintaining context within topic themes
- **Automatic conversation generation** with 30-second intervals between responses
- **File-based topic archiving** saving completed conversations as text files

## Key Design Patterns
- **Repository Pattern** with IStorage interface including file system operations
- **Component-based architecture** with folder-like topic browser interface
- **Event-driven real-time updates** using SSE with slower, readable typing effects
- **Topic management system** with automatic archiving and browseable history
- **Dual-interface design** - live terminal view and archive browser
- **Purple theme implementation** with white background and clean visibility

## Development Features
- **Hot module replacement** in development mode
- **Development tooling** with error overlays and cartographer plugins
- **TypeScript strict mode** with comprehensive path mapping
- **ESLint and Prettier** configuration for code quality
- **Build optimization** with separate client/server bundling strategies