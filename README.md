# DPV Mitgliederverwaltung UI

The **Deutscher Parkour Verband (DPV) Membership Management UI** is the official web frontend for managing users, parkour clubs, and memberships within the German Parkour Association infrastructure.

## About

This application provides a modern, responsive interface for the DPV Membership Management platform, allowing users and administrators to:

- **Dashboard**: Get an overview of all registered clubs and their membership status.
- **Club Management**: Create, edit, and manage parkour club details.
- **Membership Actions**: Apply for membership, cancel applications, or (as Admin) approve/deny requests.
- **User Profile**: Manage personal data, including name updates and email validation workflows.
- **Authentication**: Secure login, registration, and password reset flows.

## Features

- ✅ **Responsive Design**: Mobile-first, dark-mode-first aesthetic with dynamic animations.
- ✅ **Dynamic Dashboards**: Context-aware views for regular users and administrators.
- ✅ **Membership Workflows**: Direct integration with the DPV backend for status transitions.
- ✅ **Profile Management**: Self-service user profile updates with secure email validation.
- ✅ **Clean UI**: Built with a premium look using vanilla CSS, Tailwind CSS 4, and Lucide icons.

## Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with PostCSS
- **Navigation**: [React Router 7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: Custom components built with [Radix UI](https://www.radix-ui.com/) primitives

## Project Structure

```
src/
├── components/          # Reusable UI components (Buttons, Cards, Layout, etc.)
│   └── ui/             # Shadcn-inspired base components
├── context/            # Authentication and global state management
├── lib/                # API client and utility functions
├── pages/              # Page components (Dashboard, Profile, Login, etc.)
├── types/              # TypeScript interfaces and shared constants
├── App.tsx             # Main application component
├── router.tsx          # Route definitions and protected route logic
└── main.tsx            # Application entry point
```

## Prerequisites

- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher
- **Backend**: A running instance of the [DPV Backend API](https://github.com/parkour-de/dpv)

## Getting Started

### 1. Installation

Clone and install dependencies:

```bash
npm install
```

### 2. Configuration

Ensure your environment is configured to point to the correct API base URL. By default, the application expects the API at `http://localhost:8070/dpv`.

### 3. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080` (or the port specified in your console).

### 4. Build

Create a production build:

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Deutscher Parkour Verband** - Building the infrastructure for parkour in Germany 🏃‍♂️
