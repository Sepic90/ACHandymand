# PIBLO - Complete App Overview

**Business Management Platform for Danish Blue-Collar Companies**

*Test Client: AC Handymand.dk ApS*

---

## 1. QUICK OVERVIEW

Piblo is a centralized web application that functions as a streamlined ERP system for small Danish totalentreprise (handyman/construction) companies with fewer than 10 employees. The app replaces scattered Excel spreadsheets and Word documents with an integrated platform for managing projects, tracking employee time and absences, handling materials and suppliers, maintaining files, and generating professional timesheet PDFs. Built on React/Vite with Firebase backend (EU servers for GDPR compliance), the system features complete Danish localization and is currently being tested by AC Handymand.dk ApS, a family-owned business with approximately 5 hourly contractors plus office staff.

**Core Modules:**
- **Sager** (Projects) - Central hub for case management
- **Timeregistrering** (Time Registration) - Employee hours and absence tracking
- **Materialer** (Materials) - Supplier and materials management with purchase tracking
- **Kalender** (Calendar) - Employee scheduling and project appointments
- **Indstillinger** (Settings) - Company configuration and employee administration

---

## 2. THE PAIN POINT

The target users (small Danish handyman companies) are drowning in administrative chaos with:
- Endless folders of Word documents and Excel sheets scattered across systems
- No centralized view of project status, costs, or timelines
- Manual timesheet creation consuming hours each month
- Difficulty tracking which employees worked when and where
- No clear material cost tracking or profit margin visibility
- Lost files and documents with no organized storage system
- Office workers intimidated by complex software solutions

**The Solution:** A user-friendly, single-source-of-truth system that feels like "upgraded spreadsheets" rather than intimidating enterprise software, with warm, approachable UX design featuring emoji icons, friendly greeting messages, and progressive disclosure to avoid overwhelming non-technical users.

---

## 3. CURRENT FUNCTIONS & DATA LINKAGE

### A) SAGER MODULE (Projects)

**Primary Functions:**
- **Project Creation & Management**: Auto-generated project numbers in YYYY-0001 format (e.g., 2025-0023), stores complete project data including customer info, address, phone, email, project type (Vedligeholdelse/Ombygning), and status tracking (Tilbud sendt/I gang/Afventer/Afsluttet)
- **Time Entry Tracking**: Employees log hours worked per project with activity descriptions, hourly rates, and billable/non-billable designation
- **Project Overview Dashboard**: Color-coded cards showing all projects with at-a-glance status badges, customer names, and addresses with Google Maps integration
- **Four-Tab Detail View**: 
  - **Overblik** (Overview): Project information, statistics (total hours, billable hours, total value), time entries table
  - **Timeregistrering** (Time Registration): Add and manage time entries with employee selection
  - **Materialer** (Materials): Linked material purchases showing costs and profit margins
  - **Filer** (Files): Document management system

**Data Structure:**
- Collection: `projects` with auto-incrementing project numbers via `projectCounter` collection
- Fields: `projectNumber`, `projectName`, `customerName`, `address`, `city`, `zipCode`, `phone`, `email`, `type`, `status`, `createdAt`, `updatedAt`
- Linked to `timeEntries` via `projectId`
- Linked to `materialPurchases` via `caseId`
- Linked to `files` collection via `sagsnummer`

### B) TIMEREGISTRERING MODULE (Time Registration)

**Primary Functions:**
- **Employee Management**: Complete employee roster with names, roles, and absence tracking
- **Absence System**: Comprehensive tracking of five absence types:
  - **Feriedag** (Vacation Day): Standard paid vacation
  - **Feriefridag** (Vacation Freedom Day): Shows "Feriefri (FF) 1500 Kr." in PDF with 0 hours
  - **Syg** (Sick Day): Displays missed hours (e.g., "Sygedag: 7,5 timer")
  - **Søgnehelligdag** (Public Holiday): Shows "Søgnehelligdag (SH) 1500 Kr." with 14.7% wage accumulation tracking (currently being implemented)
  - **Andet** (Other): Catch-all category with optional comments
- **Absence Entry Types**: Partial absence (specify hours worked), single-day absence, extended absence (date ranges)
- **PDF Timesheet Generation**: Creates professional monthly timesheets (20th to 19th cycle) with:
  - Company branding and employee name
  - Danish weekday names with weekend highlighting
  - Pre-populated standard work hours (07:00-15:00 Mon-Thu = 7.5h, 07:00-14:30 Fri = 7h)
  - Absence data integration showing types and compensation
  - "Afvigelse / Bemærkning" column for comments
  - Total hours calculation row for manual pen entry
- **Overtime Tracking**: Register and track overtime hours per employee

**Data Structure:**
- Collection: `employees` with fields for name, role, email, phone, hourly rates
- Collection: `absences` with fields: `employeeId`, `date` (DD/MM/YYYY), `absenceType`, `hoursWorked`, `comment`
- Collection: `overtime` tracking additional hours
- **Søgnehelligdage (SH) System**: Tracks 14.7% hourly rate accumulation per public holiday for December payout (in development)

**Key Integration:**
- Absence data flows into Kalender module for visual scheduling
- Employee data used in Sager module for time entry attribution
- PDF system reads from both standard work hours and absence records

### C) MATERIALER MODULE (Materials)

**Primary Functions:**
- **Three-Tab Interface**:
  - **🏪 Leverandører** (Suppliers): Master database of suppliers with CVR numbers, contact info, customer account numbers, and type categorization
  - **📦 Katalog** (Catalog): Material master data with names, categories, units of measurement, standard pricing
  - **🛒 Alle Indkøb** (All Purchases): Transaction-level tracking of material purchases
- **Supplier Management**: Create, edit, delete suppliers with full contact details and CVR validation
- **Material Catalog**: Maintain standardized material database with categories (Træ, Metal, Maling, Værktøj, Elektrisk, VVS, Isolering, Diverse)
- **Purchase Tracking**: Record material purchases with:
  - Linked supplier and material (with denormalized name storage for historical integrity)
  - Quantity and unit of measurement
  - Purchase price and selling price (total, not per-unit)
  - Automatic profit margin calculation
  - Date tracking and notes
  - Optional case/project linkage
- **Summary Statistics**: Three summary boxes showing total purchase cost, total selling price, and total profit across all purchases
- **Search & Filter**: Real-time search across suppliers/materials, dropdown filters by type/category

**Data Structure:**
- Collection: `suppliers` with CVR number, name, address, contact info, account numbers
- Collection: `materials` with name, category, unit, standard prices
- Collection: `materialPurchases` with:
  - `supplierId` and `supplierName` (denormalized for data integrity)
  - `materialId` and `materialName` (denormalized)
  - `quantity`, `unit`, `purchasePrice`, `sellingPrice` (both totals)
  - `caseId` for project linkage (optional)
  - `date`, `notes`
- **Calculation Method**: All prices stored as totals (quantity × unit price), profit = sellingPrice - purchasePrice

**Key Integration:**
- Material purchases link to specific projects in Sager module via `caseId`
- Project detail pages display linked material costs and profit margins
- Denormalized storage ensures historical purchase records remain intact even if supplier/material master data is deleted

### D) KALENDER MODULE (Calendar)

**Primary Functions:**
- **Monthly Calendar View**: Standard calendar grid showing current month with previous/next navigation
- **Employee Color-Coding**: Each employee assigned consistent color for visual scheduling
- **Integrated Absence Display**: Automatically shows employee absences from Timeregistrering module as colored bars
- **Project Appointments**: Create and manage project-related events with:
  - Date and time selection
  - Project linkage (shows case number in event)
  - Employee assignment
  - Event notes/descriptions
- **Event Display Format**: Shows "(Project ID) - (Event note)" for project events, employee name for absence events
- **Responsive Tile Design**: Rectangular date tiles (not square) to maximize screen space on 16:9 displays, with adjustable grid gaps

**Data Structure:**
- Collection: `calendarEvents` with fields: `date`, `projectId`, `employeeId`, `type`, `note`, `startTime`, `endTime`
- Reads from `absences` collection for automatic absence display
- Reads from `employees` for color assignment and names
- Links to `projects` via `projectId` for displaying case numbers

**Key Integration:**
- Pulls absence data directly from Timeregistrering module
- Links to Sager module for project context
- Can create appointments directly from individual case pages (project detail view)

### E) FILER MODULE (Files - Within Projects)

**Primary Functions:**
- **Three-Category Organization**: Files sorted into:
  - **Billeder** (Images): Photos from job sites, before/after documentation
  - **Bilag** (Receipts): Financial documents, invoices, purchase receipts
  - **Dokumenter** (Documents): PDFs, contracts, specifications
- **File Upload System**: Drag-and-drop or click-to-upload interface with:
  - Category selection modal
  - Client-side image compression (reduces to ~1MB at 80% quality)
  - Thumbnail generation (300px) for images
  - Progress bar during upload
  - Optional file notes/descriptions (shows with 💬 icon)
- **File Management**: Preview images in lightbox modal, open PDFs in new tab, download any file, delete files with confirmation
- **Search & Sort**: Search by filename, sort by newest/oldest/name
- **Firebase Storage Integration**: Files stored in structured paths: `projects/[sagsnummer]/[category]/[filename]`

**Data Structure:**
- **Firebase Storage**: Physical file storage at `projects/{sagsnummer}/{category}/{fileId}`
- **Firestore Collection**: `files` metadata with fields:
  - `sagsnummer` (project link)
  - `fileName`, `fileType`, `fileSize`
  - `category` (Billeder/Bilag/Dokumenter)
  - `downloadURL`, `thumbnailURL`
  - `description` (optional notes)
  - `uploadedBy`, `uploadedAt`
- **Validation**: 10MB file size limit, file type restrictions per category

**Key Integration:**
- Appears as tab in project detail view (SagDetails)
- Files permanently linked to specific project via `sagsnummer`
- Supports project documentation workflow from quote to completion

### F) INDSTILLINGER MODULE (Settings)

**Primary Functions:**
- **Company Information**: Store and manage company name, address, contact details, CVR number
- **Default Hourly Rate**: Set standard billing rate for time calculations
- **Employee Administration**: Complete CRUD operations for employee management, integrated with absence tracking system

**Data Structure:**
- Collection: `settings` (singleton document)
- Collection: `employees` (managed through this module)

---

## 4. ARCHITECTURE NOTES

**Technology Foundation:**
- Frontend framework with build tooling
- Backend with database
- Cloud storage with EU data residency
- User authentication system
- Client-side PDF generation
- Client-side image processing

**Design Patterns:**
- **Modular Architecture**: Each module is self-contained with dedicated components, utilities, and database collections
- **Denormalized Data Strategy**: Material purchases store copies of supplier/material names to preserve historical records even if master data is deleted
- **Notification System**: Custom toast notifications (not browser alerts) using reusable notification utility
- **Modal Pattern**: Consistent modal components for data entry across all modules
- **Progressive Disclosure**: Filters and advanced options hidden by default, expandable on demand
- **Responsive Design**: Mobile-friendly layouts with breakpoints for tablet/desktop

**Database Collections:**
- `projects` (project master data)
- `projectCounter` (auto-increment tracking per year)
- `timeEntries` (hours worked per project)
- `employees` (workforce roster)
- `absences` (vacation, sick days, holidays)
- `overtime` (additional hours tracking)
- `suppliers` (vendor master data)
- `materials` (material catalog)
- `materialPurchases` (transaction records)
- `calendarEvents` (appointments and scheduled work)
- `files` (file metadata)
- `settings` (company configuration)

**State Management:**
- Component-level state with React hooks (useState, useEffect)
- Real-time data synchronization
- No global state management currently (may be needed for complex calendar/user role features)

**Security:**
- Database rules: All collections require authentication
- Role-based access planned but not yet implemented
- Critical deletions require typed "Slet" confirmation

---

## 5. USER EXPERIENCE PHILOSOPHY

The design deliberately avoids typical "enterprise software" intimidation through:

- **Warm Greetings**: Pages open with "Hej! Her er dine sager" instead of cold data tables
- **Emoji Icons**: Friendly visual cues (🏪📦🛒 for tabs, 💬 for notes, 🔍 for search)
- **Colorful Tabs**: Visual hierarchy with color-coded sections instead of gray monotony
- **Large Touch Targets**: Big search boxes and buttons for easy interaction
- **Progressive Disclosure**: Complexity hidden until needed (filters expand on click)
- **Empty States**: Helpful messages with guidance when no data exists
- **Consistent Patterns**: Same modal structure, button styles, and interaction patterns across all modules
- **Danish Throughout**: Complete localization including dates, currency, and business terminology

This approach makes non-technical office workers feel confident exploring the system rather than frightened by complexity.

---

## 6. CURRENT DEPLOYMENT STATUS

- **Test Client**: AC Handymand.dk ApS (family-owned business)
- **Firebase Project**: achandymand-145da
- **Build Process**: Vite production build → dist/ folder → Firebase deploy
- **Development**: npm run dev on localhost:5173
- **Hosting**: Firebase Hosting with EU servers (GDPR compliant)

---

## 7. TARGET MARKET

If development is successful with AC Handymand.dk ApS, the plan is to sell Piblo as a platform to other small Danish blue-collar companies (fewer than 10 employees) in the handyman and construction sectors. The system is designed to be company-agnostic with configurable settings for company information, making it suitable for multiple clients.

---

*Document Generated: November 2025*  
*Version: Current State Overview*
