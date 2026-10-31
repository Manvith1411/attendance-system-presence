# Presence — Attendance Management System

A responsive, browser-based attendance management system for colleges and departments. **Presence** gives faculty a fast way to record attendance, students a clear view of their attendance, and administrators the tools to configure the institute and manage academic data.

> This project is currently a frontend-only application. Data is persisted in the browser with `localStorage`.

## Features

- **Role-based access** for Master Admin, Faculty, and Student users
- **Faculty attendance marking** by course, date, session weight, and lecture topic
- **Student attendance dashboard** with course-wise attendance summaries
- **Attendance register** with search, present/absent status, threshold indicators, and CSV export
- **OD / leave requests** with student submission and faculty approval workflows
- **Admin configuration** for institute, department, attendance threshold, and administrator credentials
- **Academic management** for student batches, faculty roster, departments, and course allotments
- **Responsive interface** with grid/list views and light/dark theme support
- **Browser persistence** so configured data survives page reloads on the same device

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React icons
- ESLint

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```bash
git clone https://github.com/Manvith1411/attendance-system-presence.git
cd attendance-system-presence
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## First-time setup

1. Open the app and complete the institute setup screen.
2. Configure the institute, department, attendance threshold, and Master Admin credentials.
3. Sign in as Master Admin to add students, faculty, and courses.
4. Allot courses to faculty and enroll students in the relevant courses.
5. Sign in as Faculty to mark attendance or review OD / leave requests.
6. Sign in as Student using the registered USN to view attendance and submit requests.

## Project structure

```text
src/
├── App.tsx       # Application state, authentication, views, and workflows
├── App.css       # Component and layout styles
├── index.css     # Tailwind entry point
└── main.tsx      # React application entry point
public/           # Static assets and favicon
```

## Data and deployment notes

Presence does not currently include a backend or shared database. Records are stored in the browser's `localStorage`, so they are local to the browser/device and are not automatically synchronized between users. For a production deployment, add an authenticated backend and shared database before using the app across multiple devices.

To create a production build:

```bash
npm run build
```

The generated files are placed in `dist/` and can be served by any static hosting provider that supports single-page applications.

## Contributing

1. Create a feature branch.
2. Make your changes and run `npm run lint` and `npm run build`.
3. Open a pull request with a short description of the change and any relevant screenshots.

## License

No license has been specified yet.
