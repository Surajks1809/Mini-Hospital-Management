# MediCare HMS – Premium Hospital Management System

MediCare HMS is a complete, production-quality Hospital Management SaaS application built for modern hospitals, multi-speciality clinics, and healthcare networks. Designed with a clean, medical-grade aesthetic, robust PostgreSQL relational architecture, and full clinical workflow automation.

---

## 🌟 Key Capabilities & Modules

1. **Enterprise Multi-Tenant Hospital Isolation & Data Security**
   - **Dedicated Tenant Scoping**: Every doctor / clinic owner who signs up receives their own isolated `Hospital` database entity.
   - **100% Cross-Doctor Privacy**: Doctor A from "City Heart Hospital" can NEVER view, query, or edit data belonging to Doctor B from "Apex Clinic".
   - All database queries, mutations, indexes, unique constraints, and analytics are strictly partitioned by `hospitalId`.
   - Zero hardcoded demo or fake doctor records — clean, production-ready operational directory.

2. **Self-Service Doctor & Hospital Registration (Sign Up & Sign In)**
   - **Sign In Tab**: Fast login for registered hospital personnel (includes 1-click helper for the default administrator).
   - **Register New Hospital Tab**: First-time doctors or clinic owners can register in seconds with Doctor Name, Hospital Name, Work Email, Phone, and Password.
   - Automatically provisions their private workspace and routes them directly to their dedicated dashboard and hospital settings.

3. **Brand & Executive UI Design**
   - Palette: Deep Medical Blue (`#2563EB`), Navy (`#14213D`), and Clinical Teal (`#0D9488`).
   - Clean whitespace, soft shadows, rounded enterprise cards, and responsive sidebar navigation.
   - Professional SVG emblem: Medical cross combined with an active vital pulse wave.
   - Global Search (`Ctrl + K`) across patients, doctors, appointments, and billing invoices.

2. **Executive Real-Time Dashboard**
   - 5 Dynamic KPI Cards connected to live database aggregates:
     - **Total Registered Patients**
     - **Today's Scheduled Consultations**
     - **Total Medical Specialists**
     - **Total Realized Revenue (₹)**
     - **Pending Outstanding Invoices (₹)**
   - Interactive Recharts Visualizations:
     - Monthly Revenue & Collections area trend with gradients.
     - 7-Day Patient Registration Flow bar chart.
   - Quick action shortcuts (Add Patient, Book Appointment, Generate Invoice).
   - Real-time lists for upcoming consultations and recent admissions.

3. **Patient Management & Clinical Records**
   - Auto-generated Patient ID (e.g. `MED-P-2026-001`).
   - Comprehensive registration: Full Name, Gender, Date of Birth, **Auto-calculated Age**, Blood Group, Emergency Contact, Residential Address.
   - Clinical Profile: Past Medical History, Allergies, and Chronic Conditions.
   - Patient Profile Modal with full demographics, appointments timeline, and billing invoice history.
   - Instant Search (by name, ID, phone, email), Filter by Gender and Blood Group, Sortable Columns, and Pagination.
   - Safe deletion with two-step confirmation dialogs.

4. **Appointment Management & Conflict Prevention**
   - Fields: Appointment ID (`APT-2026-001`), Patient, Doctor, Department, Date, Time Slot, Symptoms/Reason for Visit, Status.
   - **Smart Duplicate Prevention**: Automatically prevents and warns if a doctor already has a confirmed consultation at the exact same date and time slot (HTTP 409 Conflict).
   - Filter by date (Today / Upcoming / All), attending Doctor, and status (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
   - One-click status transitions (Mark Completed, Cancel).

5. **Doctor & Specialist Directory**
   - Fields: Doctor ID (`DOC-101`), Name, Specialization, Department, Consultation Fee (₹), Availability Status (`AVAILABLE`, `IN_CONSULTATION`, `ON_LEAVE`, `EMERGENCY_ONLY`), Qualifications, and OPD Room Number.
   - Add, edit, search, and remove specialists.
   - Live consultation counters per doctor.

6. **Billing & Payment Module (Indian Rupees ₹)**
   - Auto-generated Tax Invoice Number (`INV-2026-0001`).
   - Itemized hospital fee breakdowns:
     - Specialist Consultation Charges
     - Pharmacy & Medicine Charges
     - Pathology & Radiology Diagnostic Charges
     - Procedural & Hospital Support Charges
   - Automatic live computation:
     $$\text{Subtotal} = \text{Consultation} + \text{Medicine} + \text{Lab} + \text{Other}$$
     $$\text{Taxable} = \max(0, \text{Subtotal} - \text{Discount})$$
     $$\text{Grand Total} = \text{Taxable} + \left(\frac{\text{Taxable} \times \text{TaxRate}}{100}\right)$$
   - Printable Medical Tax Invoice with hospital header, GSTIN, patient details, itemized grid, and authorized signature section.
   - **Download Invoice as PDF** (via high-resolution canvas capture) and **Direct Print** (`window.print()`).
   - Payment status tracking (`PAID`, `PARTIALLY_PAID`, `PENDING`) and partial payment recording.

7. **Reports & Analytics with CSV Export**
   - Patient registration volume metrics.
   - Financial collection vs pending balance summaries.
   - Doctor-wise workload, consultation volume, and revenue generated.
   - Date range filtering.
   - **One-Click CSV Exports** for Patients, Revenue, and Appointments datasets.

8. **Settings & Institutional Administration**
   - Hospital institutional profile (Hospital Name, Tagline, Address, Phone, Email, 24x7 Helpline, GSTIN).
   - Currency symbol configuration (default: `₹`) and default Tax / GST rate (%).
   - Administrator profile management and secure password change.
   - **Demo Data Reset Button**: Re-seeds the database back to standard demo state anytime.

9. **Security & Session Authentication**
   - Secure password hashing using bcrypt (`saltRounds = 10`).
   - Signed JSON Web Tokens (JWT) with bearer authorization.
   - Route protection on frontend and backend authorization middleware.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Router v7 |
| **Backend** | Node.js, Express.js, TypeScript, tsx, CORS, dotenv, JSON Web Tokens, bcryptjs |
| **Database & ORM** | PostgreSQL (v18), Prisma ORM |
| **Reporting / Export** | jsPDF, html2canvas, Native CSV generation |

---

## 🔑 Demo Login Credentials

| Role | Email Address | Password |
|---|---|---|
| **Hospital Administrator** | `admin@medicare.com` | `admin123` |

*(A quick **"Auto-fill"** helper button is also available on the login page for instant demo access).*

---

## 🏥 Fresh System State

The system is configured in a **clean, production-ready operational state**:
- **0 Fake Doctor Entries**: Ready for you to add real doctors and consultants with their real specializations, fees, and departments.
- **0 Fake Patient Entries**: Ready for real patient registrations.
- **0 Fake Appointments & Invoices**: Clean slate for live hospital scheduling and billing transactions.
- **1 Master Admin Account**: Pre-configured for immediate access (`admin@medicare.com` / `admin123`).
- **1 Hospital Profile**: Fully editable under Settings (Hospital Name, Address, GSTIN, Phone, Currency ₹).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or v20+)
- **npm** (v9+)
- **PostgreSQL** (v14+) running locally

### 2. Clone & Install Dependencies
```bash
# Navigate to the project root
cd "Hospital Management"

# Install all dependencies (root, server, and client)
npm run install:all
```

### 3. Database Setup & Environment Configuration

The backend environment file is located at `server/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres@127.0.0.1:5433/medicare_hms?schema=public"
JWT_SECRET="medicare_super_secret_jwt_key_2026_enterprise_production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```
*(Adjust the port or user in `DATABASE_URL` if connecting to your own PostgreSQL instance).*

### 4. Run Migrations & Seed Demo Data
```bash
cd server
npx prisma db push
npm run prisma:seed
```

### 5. Start the Application
Run both server and frontend client concurrently from the project root:
```bash
npm run dev
```

Or run each service individually:
```bash
# Terminal 1 - Backend API Server (Port 5000)
cd server
npm run dev

# Terminal 2 - Frontend Client (Port 5173)
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`** and log in with:
- **Email:** `admin@medicare.com`
- **Password:** `admin123`

---

## 📑 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Creates a new private Hospital tenant and administrator doctor account. Returns scoped JWT.
- `POST /api/auth/login` – Authenticates user credentials & returns JWT scoped to their hospital.
- `GET /api/auth/me` – Returns authenticated admin profile and hospital details.
- `PUT /api/auth/profile` – Updates name and phone number.
- `PUT /api/auth/change-password` – Validates current password and updates hash.

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard` – Real-time aggregated stats, revenue area chart data, patient registration trends, upcoming appointments, and recent admissions.

### Patients (`/api/patients`)
- `GET /api/patients` – Paginated list with search, gender & blood group filters.
- `GET /api/patients/:id` – Full clinical profile with appointments & invoices.
- `POST /api/patients` – Register patient (auto-generates `MED-P-YYYY-XXX` and computes age).
- `PUT /api/patients/:id` – Edit patient demographics & clinical background.
- `DELETE /api/patients/:id` – Deletes patient record.

### Doctors (`/api/doctors`)
- `GET /api/doctors` – Doctor directory with search & department filters.
- `GET /api/doctors/:id` – Doctor profile with assigned appointments.
- `POST /api/doctors` – Add new specialist (auto-generates `DOC-XXX`).
- `PUT /api/doctors/:id` – Update doctor details & availability status.
- `DELETE /api/doctors/:id` – Remove doctor.

### Appointments (`/api/appointments`)
- `GET /api/appointments` – Paginated appointments with filters (`today`, `upcoming`, doctor, status).
- `POST /api/appointments` – Create appointment (enforces conflict check: blocks duplicates for same doctor, date & time slot).
- `PUT /api/appointments/:id` – Modify appointment schedule.
- `PATCH /api/appointments/:id/cancel` – Cancels appointment.

### Billing & Invoices (`/api/invoices`)
- `GET /api/invoices` – Invoices list with search & status filters.
- `GET /api/invoices/:id` – Invoice details with itemized charges & payments.
- `POST /api/invoices` – Generate invoice with auto-numbering, tax, and totals.
- `PATCH /api/invoices/:id/payment` – Records partial/full payment receipt.
- `DELETE /api/invoices/:id` – Delete invoice.

### Reports & Export (`/api/reports`)
- `GET /api/reports/summary` – Summary metrics & doctor-wise workload statistics.
- `GET /api/reports/export?type=(patients|revenue|appointments)` – Direct CSV download.

### Settings (`/api/settings`)
- `GET /api/settings` – Retrieve hospital profile & tax configuration.
- `PUT /api/settings` – Update hospital details.
- `POST /api/settings/reset-demo` – Restores 15 patients, 5 doctors, 10 appointments, 10 invoices.

---

## 📱 Responsive Layout
The interface is designed with a responsive layout:
- **Desktop & Laptop**: Full multi-column dashboard, collapsible navigation sidebar, persistent global search.
- **Tablet**: Adaptive grids, horizontal scroll data tables, compact card layouts.
- **Mobile**: Off-canvas slide-out navigation drawer, touch-friendly action buttons, responsive forms and modals.

---

## 🔒 Security Measures
- **Password Protection**: Passwords hashed with bcrypt; plain-text passwords are never stored.
- **Session Tokens**: Protected JWT bearer tokens with expiration.
- **SQL Injection Prevention**: Prisma ORM parameterized queries.
- **Data Integrity**: Foreign key constraints and database-level cascading rules.
