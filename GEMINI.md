## Project Overview

This is a modern, full-featured Moodle Dashboard built with Next.js 15, TypeScript, and Tailwind CSS. It provides a comprehensive system for managing educational data from Moodle, integrated with the YouTube API for real-time channel statistics. The application features a robust, multi-layered authentication system, a modular and scalable architecture, and a rich, responsive user interface.

**Key Technologies:**

*   **Framework:** Next.js 15 (with App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **Authentication:** NextAuth.js v5 (with bcrypt for hashing)
*   **Database:** Prisma ORM with support for PostgreSQL (production) and SQLite (development)
*   **Data Fetching & Caching:** TanStack Query v5, Axios
*   **State Management:** Zustand
*   **UI Components:** Lucide React (icons), Recharts (charts)
*   **Form Handling:** React Hook Form with Zod for validation

## Building and Running

**1. Installation:**

```bash
npm install
```

**2. Environment Setup:**

Copy the `.env.example` to `.env.local` and fill in the required environment variables, including database credentials, NextAuth secret, and YouTube API key.

```bash
cp .env.example .env.local
```

**3. Database Migration:**

Run the following commands to set up the database schema:

```bash
npx prisma migrate dev
npx prisma generate
```

**4. Running the Development Server:**

```bash
npm run dev
```

The application will be available at `http://localhost:3002`.

**5. Building for Production:**

```bash
npm run build
```

**6. Starting the Production Server:**

```bash
npm run start
```

## Development Conventions

*   **Modular Architecture:** The codebase is highly modular, with a clear separation of concerns. Components, hooks, and utilities are organized into their respective directories.
*   **Authentication:** The application uses a hybrid authentication system with multiple layers (PostgreSQL, SQLite, in-memory fallback) to ensure resilience. Access control is role-based (ADMIN/USER).
*   **API Routes:** API endpoints are located in `src/app/api/` and follow a structured organization.
*   **State Management:** Zustand is used for global state, while TanStack Query handles server-side state and caching.
*   **Styling:** Tailwind CSS is the primary styling solution. Custom styles are kept to a minimum.
*   **Linting:** The project uses ESLint to enforce code quality. Run `npm run lint` to check for issues.
*   **Database Seeding:** The database can be seeded with initial data using the `npm run db:seed` command.
