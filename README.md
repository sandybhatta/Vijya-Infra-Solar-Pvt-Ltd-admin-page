# Solar Project Admin Panel

## Overview
This project is a modern, high-performance Admin Dashboard designed for managing solar installation projects. It features a futuristic "Glassmorphism" UI with neon accents, fully responsive design for mobile and desktop, and a comprehensive suite of features for managing leads, projects, finances, inventory, and team operations.

## Technical Stack
*   **Frontend:** React, Vite, Tailwind CSS, Framer Motion
*   **State Management:** Redux Toolkit, RTK Query
*   **Database:** Supabase (PostgreSQL) with Real-time Subscriptions
*   **UI Components:** Lucide React Icons, Shadcn UI (customized)
*   **Charts:** Recharts
*   **PDF Generation:** jsPDF, jsPDF-AutoTable
*   **Export:** XLSX, CSV

---

## Complete Application Routes & Features

This document provides an in-depth explanation of all 22 application routes, their CRUD operations, displayed information, and key features.

---

## 🏠 Core Dashboard & System

### `/dashboard` - Dashboard
**Component:** `Dashboard.jsx`

**Purpose:** Central command center displaying real-time business intelligence and key performance indicators.

**CRUD Operations:**
- **READ:** Fetches KPI data, recent leads, revenue trends, project statistics

**Features & Information Displayed:**
- **Real-time KPIs:**
  - Total Revenue (sum of all payments)
  - Active Projects count
  - New Leads count
  - Conversion rates
- **Visualizations:**
  - Revenue trend charts (line/area charts)
  - Project status distribution (pie charts)
  - Lead pipeline funnel
- **Recent Activity:**
  - Latest lead enquiries with quick actions
  - Recent project updates
- **Profit Calculator:**
  - Total Invoiced vs Total Expenses comparison
  - Net profit margins
- **Real-time Updates:** Supabase subscriptions for live data

---

### `/users` - Users Management
**Component:** `Users.jsx`

**Purpose:** Manage all system users (customers/clients) with detailed profiles and activity tracking.

**CRUD Operations:**
- **CREATE:** Not implemented (users created via lead conversion)
- **READ:** View all users with pagination, search, and filtering
- **UPDATE:** Not implemented in this view
- **DELETE:** Delete user accounts with confirmation

**Features & Information Displayed:**
- **User List Table:**
  - Name, Email, Phone
  - Registration date
  - Account status
  - Associated leads/projects count
- **Search & Filter:**
  - Search by name, email, phone
  - Filter by status, date range
- **Bulk Actions:**
  - Bulk delete users
  - Select all/individual users
- **Export:**
  - CSV export with user details
  - Custom column selection
- **User Details Drawer:**
  - Complete user profile
  - Associated leads
  - Associated projects
  - Activity history

---

### `/notifications` - Notifications Center
**Component:** `Notifications.jsx`

**Purpose:** Real-time notification feed for system alerts and important updates.

**CRUD Operations:**
- **READ:** Fetch and display notifications in real-time

**Features & Information Displayed:**
- **Notification Feed:**
  - Title and message
  - Timestamp (relative time)
  - Notification type indicator
- **Real-time Updates:**
  - Live notifications via Supabase subscriptions
  - Auto-refresh on new notifications
- **Notification Types:**
  - Low stock alerts
  - New lead assignments
  - Overdue tasks
  - Payment received
  - Invoice due
  - Project status changes

---

### `/activity-logs` - Activity Logs
**Component:** `ActivityLogs.jsx`

**Purpose:** Comprehensive audit trail and activity monitoring system with advanced filtering and analytics.

**CRUD Operations:**
- **CREATE:** Not applicable (logs auto-generated)
- **READ:** View all system activities with advanced filtering
- **UPDATE:** Mark as read/unread
- **DELETE:** Delete individual or bulk logs

**Features & Information Displayed:**
- **Activity Log Table:**
  - Activity type (lead, payment, invoice, project, task, expense, etc.)
  - Title and message
  - Timestamp
  - Read/Unread status
  - Related entity links
- **Advanced Filtering:**
  - Filter by type (lead, payment, invoice, project, task, etc.)
  - Filter by read/unread status
  - Date range filtering
  - Sort by newest/oldest/unread first
- **Bulk Actions:**
  - Mark multiple as read/unread
  - Bulk delete
  - Select all functionality
- **Analytics Dashboard:**
  - Activity distribution by type
  - Activity trends over time
  - Unread count
  - Total activity count
- **Export:**
  - CSV export with filters applied
  - JSON export for data analysis
- **Real-time Updates:**
  - Live activity feed via Supabase subscriptions
- **Auto-mark Read:**
  - Optional auto-mark as read on view

---

### `/settings` - System Settings
**Component:** `Settings.jsx`

**Purpose:** Centralized configuration hub for all system settings across 8 different categories.

**CRUD Operations:**
- **READ:** Fetch all settings across different categories
- **UPDATE:** Update settings in real-time

**Features & Information Displayed:**

**8 Settings Tabs:**

1. **Business Profile:**
   - Company name, logo, contact info
   - Business address
   - Tax/GST information
   - Invoice templates

2. **Admin Users:**
   - Manage admin accounts
   - Role-based access control
   - Invite new admins
   - Activate/deactivate accounts

3. **Lead Sources:**
   - Configure lead acquisition channels
   - Track source performance
   - Enable/disable sources

4. **Expense Categories:**
   - Define expense types
   - Set budget limits
   - Category-wise tracking

5. **Materials Pricing:**
   - Set default material prices
   - Bulk price updates
   - Price history

6. **Marketing Campaigns:**
   - Campaign templates
   - Default budgets
   - Platform configurations

7. **Security & System:**
   - Password policies
   - Session management
   - Two-factor authentication
   - API keys

8. **Backup & Export:**
   - Database backups
   - Export all data
   - Import/restore functionality

**Real-time Sync:**
- All settings sync in real-time across users
- Instant updates via Supabase subscriptions

---

## 👥 CRM & Sales Management

### `/leads` - Leads Management
**Component:** `Leads.jsx`

**Purpose:** Primary CRM interface for managing potential customers through the sales pipeline.

**CRUD Operations:**
- **CREATE:** Add new leads via modal form
- **READ:** View leads in Kanban or List view with filtering
- **UPDATE:** Edit lead details, update status, add notes
- **DELETE:** Delete individual or bulk leads

**Features & Information Displayed:**

**Two View Modes:**
1. **Kanban Board:**
   - Drag-and-drop status updates
   - Visual pipeline (New → Contacted → Qualified → Proposal → Won/Lost)
   - Card shows: Name, Phone, Email, Source, Value
   
2. **List/Table View:**
   - Sortable columns
   - Advanced filtering
   - Bulk selection

**Lead Information:**
- Name, Email, Phone
- Lead source
- Status (New, Contacted, Qualified, Proposal Sent, Won, Lost)
- Estimated project value
- Location/Address
- Notes and comments
- Assigned sales rep
- Created date, Last contacted date

**Features:**
- **KPI Bar:**
  - Total leads count
  - Conversion rate
  - Average deal value
  - Win rate
- **Filtering:**
  - By status, source, date range
  - By assigned employee
  - By value range
- **Bulk Actions:**
  - Bulk status update
  - Bulk delete
  - Bulk assignment
- **Insights Panel:**
  - Lead source performance
  - Conversion funnel
  - Time-to-conversion metrics
- **Real-time Updates:**
  - Live lead updates via Supabase
- **Export:**
  - CSV export with filters

---

### `/leads/:id` - Lead Details
**Component:** `LeadDetails.jsx`

**Purpose:** Comprehensive single-lead view with full interaction history and conversion tools.

**CRUD Operations:**
- **READ:** Fetch complete lead details, history, tasks, quotations
- **UPDATE:** Update lead status, add notes, edit details
- **DELETE:** Delete lead (with confirmation)

**Features & Information Displayed:**

**Lead Overview Card:**
- Full contact information
- Current status with visual badge
- Lead source
- Estimated value
- Created and last updated dates
- Assigned employee

**Status Update Section:**
- Quick status change dropdown
- Add notes with status change
- Status change history

**Activity Timeline:**
- Complete interaction history
- Status changes with timestamps
- Notes and comments
- Task completions
- Quotations sent
- Email/call logs

**Related Information:**
- **Tasks:** All tasks associated with this lead
- **Quotations:** All quotes sent to this lead
- **Documents:** Uploaded files and attachments

**Quick Actions:**
- Create task for this lead
- Generate quotation
- Convert to project
- Send email
- Schedule call
- Add note

**Real-time Updates:**
- Live status changes
- Real-time task updates

---

### `/lead-status-history` - Lead Status History
**Component:** `LeadStatusHistory.jsx`

**Purpose:** Global audit trail of all lead status changes across the system.

**CRUD Operations:**
- **READ:** View all lead status changes with pagination

**Features & Information Displayed:**
- **History Table:**
  - Lead name
  - New status
  - Notes/reason for change
  - Changed by (user)
  - Timestamp
- **Filtering:**
  - Search by lead name
  - Filter by status
  - Date range filtering
- **Pagination:**
  - 50 records per page
  - Total count display

---

### `/lead-sources` - Lead Sources Analytics
**Component:** `LeadSources.jsx`

**Purpose:** Track and analyze lead acquisition channels to optimize marketing spend.

**CRUD Operations:**
- **CREATE:** Add new lead sources
- **READ:** View all sources with performance metrics
- **UPDATE:** Edit source details
- **DELETE:** Delete sources (with lead count check)

**Features & Information Displayed:**

**KPI Cards:**
- Total sources count
- Total leads from all sources
- Best performing source
- Average leads per source

**Source Performance Table:**
- Source name
- Total leads count
- Conversion rate
- Cost per lead (if budget tracked)
- Active/Inactive status
- Created date

**Analytics:**
- Lead distribution by source (pie chart)
- Source performance comparison (bar chart)
- Trend analysis over time

**Features:**
- **Search & Sort:**
  - Search by source name
  - Sort by leads, conversion rate
- **Source Details Drawer:**
  - Complete source analytics
  - Lead list from this source
  - Conversion funnel
  - ROI calculation
- **Export:**
  - CSV export with analytics
- **Real-time Updates:**
  - Live source statistics

---

### `/campaigns` - Marketing Campaigns
**Component:** `Campaigns.jsx`

**Purpose:** Manage and track marketing campaigns with budget monitoring and performance analytics.

**CRUD Operations:**
- **CREATE:** Create new campaigns via modal
- **READ:** View all campaigns with KPIs and performance data
- **UPDATE:** Edit campaign details (via modal)
- **DELETE:** Delete campaigns (with lead association check)

**Features & Information Displayed:**

**Campaign KPI Dashboard:**
- Total campaigns count
- Total budget allocated
- Total leads generated
- Average cost per lead
- Campaign ROI
- Active vs completed campaigns

**Campaign Table:**
- Campaign name
- Platform (Facebook, Google Ads, Instagram, LinkedIn, etc.)
- Budget allocated
- Leads generated
- Cost per lead
- Start and end dates
- Status (Active, Completed, Paused)
- Performance indicator

**Analytics Charts:**
- **Acquisition Trend:** Leads over time by campaign
- **Budget Utilization:** Spend vs budget
- **Geographic Performance:** Lead distribution by location
- **Platform Comparison:** Performance by platform

**Campaign Details Drawer:**
- Complete campaign overview
- Daily/weekly performance metrics
- Lead list from campaign
- Budget breakdown
- ROI calculation
- Recommendations for optimization

**Features:**
- **Filtering:**
  - By platform
  - By status (active/completed)
  - By date range
- **Search:**
  - Search by campaign name
- **Bulk Actions:**
  - Bulk delete (with confirmation)
- **Export:**
  - CSV export with campaign analytics
- **Real-time Updates:**
  - Live campaign statistics via Supabase

---

### `/quotations` - Quotations Management
**Component:** `Quotations.jsx`

**Purpose:** Create, manage, and track price quotations sent to leads.

**CRUD Operations:**
- **CREATE:** Generate new quotations with line items
- **READ:** View all quotations with status tracking
- **UPDATE:** Update quotation status (Pending, Accepted, Rejected)
- **DELETE:** Not implemented (quotations are archived)

**Features & Information Displayed:**

**Quotation Table:**
- Quotation number (auto-generated)
- Lead/Client name
- Total amount
- Status (Pending, Accepted, Rejected)
- Valid until date
- Created date
- Actions (View, Download PDF, Email, Update Status)

**Quotation Creation Modal:**
- **Line Items System:**
  - Add multiple line items
  - Item description
  - Quantity
  - Unit price
  - Automatic total calculation
- **Client Selection:**
  - Select from existing leads
- **Validity Period:**
  - Set expiration date
- **Terms & Conditions:**
  - Add custom terms
- **Auto-calculation:**
  - Subtotal, Tax, Total

**Features:**
- **PDF Generation:**
  - Professional quotation PDF
  - Company branding
  - Line-item breakdown
  - Terms and conditions
- **Email Integration:**
  - Send quotation via email (placeholder)
- **Status Tracking:**
  - Track acceptance/rejection
  - Follow-up reminders
- **Validation:**
  - Ensure valid amounts
  - Check expiration dates
- **Business Settings Integration:**
  - Pull company details from settings
  - Use configured tax rates

---

## 🛠️ Projects & Operations

### `/projects` - Projects Portfolio
**Component:** `Projects.jsx`

**Purpose:** Comprehensive project management dashboard with financial tracking and analytics.

**CRUD Operations:**
- **CREATE:** Create new projects via modal
- **READ:** View all projects with filtering and analytics
- **UPDATE:** Edit project details via modal
- **DELETE:** Delete projects via modal (with confirmation)

**Features & Information Displayed:**

**Project KPIs:**
- Total projects count
- Active projects
- Completed projects
- Total revenue
- Total profit
- Average profit margin
- Projects by status distribution

**Project Analytics Charts:**
- **Revenue Trends:** Monthly revenue from projects
- **Project Status Distribution:** Pie chart
- **Profit Margins:** Bar chart by project
- **Capacity Installed:** Total kW by solar type

**Projects Table:**
- Project name
- Client name (linked to lead)
- Status (Planning, Ongoing, Completed, Cancelled, On Hold)
- Solar type (Rooftop, Ground Mount, Hybrid)
- Capacity (kW)
- Total invoiced amount
- Total paid amount
- Total expenses
- Net profit
- Profit margin %
- Installation address
- Start date, Completion date

**Project Creation Modal:**
- Project name
- Select client (from leads)
- Solar type selection
- Capacity (kW) with validation
- Installation address
- Start date
- Expected completion date
- Initial budget

**Features:**
- **Advanced Filtering:**
  - By status
  - By solar type
  - By date range
- **Sorting:**
  - Newest/oldest
  - By profit
  - By capacity
- **Export:**
  - CSV export with ROI metrics
  - Custom column selection
- **Real-time Updates:**
  - Live project updates via Supabase
  - Real-time financial calculations
- **Financial Tracking:**
  - Automatic P&L calculation
  - Invoice vs payment tracking
  - Expense aggregation

---

### `/projects/:id` - Project Details
**Component:** `ProjectDetails.jsx`

**Purpose:** Single project command center with tabbed interface for comprehensive project management.

**CRUD Operations:**
- **READ:** Fetch complete project details, materials, tasks, financials
- **UPDATE:** Update project details, allocate materials, manage tasks
- **DELETE:** Remove allocated materials

**Features & Information Displayed:**

**Project Header:**
- Project name and status
- Client information
- System capacity
- Progress indicators

**4 Main Tabs:**

1. **Overview Tab:**
   - Client contact details
   - Installation address
   - System specifications (capacity, solar type)
   - Project timeline (start, expected completion, actual completion)
   - Project status
   - Assigned team members
   - Project notes

2. **Financials Tab:**
   - **Revenue Section:**
     - All invoices for this project
     - Total invoiced amount
     - Total paid amount
     - Outstanding balance
   - **Expenses Section:**
     - All expenses for this project
     - Expense breakdown by category
     - Total expenses
   - **Profit & Loss:**
     - Net profit calculation
     - Profit margin %
     - ROI metrics
   - **Charts:**
     - Revenue vs Expenses comparison
     - Payment timeline

3. **Materials Tab:**
   - **Allocated Materials List:**
     - Material name
     - Quantity allocated
     - Unit cost
     - Total cost
     - Allocation date
     - Remove action
   - **Allocate New Material:**
     - Select from materials catalog
     - Specify quantity
     - Auto-calculate cost
   - **Material Summary:**
     - Total materials cost
     - Materials by category
   - **Inventory Integration:**
     - Check stock availability
     - Auto-update inventory on allocation

4. **Tasks Tab:**
   - **Task List:**
     - Task description
     - Assigned employee
     - Status (Pending, In Progress, Completed)
     - Due date
     - Priority
     - Completion date
   - **Create Task:**
     - Add new installation tasks
     - Assign to employees
     - Set deadlines
   - **Task Progress:**
     - Completion percentage
     - Overdue tasks highlight

**Features:**
- **Material Allocation:**
  - Add materials from catalog
  - Quantity validation
  - Cost tracking
  - Remove materials
- **Real-time Updates:**
  - Live financial calculations
  - Real-time task updates
- **Navigation:**
  - Quick links to related invoices
  - Navigate to client details
  - View assigned employees

---

### `/tasks` - Global Task Board
**Component:** `Tasks.jsx`

**Purpose:** Centralized task management across all projects with assignment and tracking.

**CRUD Operations:**
- **CREATE:** Create new tasks via modal
- **READ:** View all tasks with filtering
- **UPDATE:** Edit tasks, update status
- **DELETE:** Delete individual or bulk tasks

**Features & Information Displayed:**

**Tasks Table:**
- Task description
- Project name (linked)
- Lead name (if lead-related)
- Assigned employee
- Status (Pending, In Progress, Completed)
- Priority (Low, Medium, High)
- Due date
- Created date
- Completion date

**Task Creation Modal:**
- Task description
- Link to project or lead
- Assign to employee
- Set due date
- Set priority
- Add notes

**Features:**
- **Filtering:**
  - By status
  - By assigned employee
  - By project
  - By priority
  - By due date range
- **Bulk Actions:**
  - Mark multiple as done
  - Mark multiple as pending
  - Bulk delete
  - Bulk reassign
- **Export:**
  - CSV export with filters
- **Real-time Updates:**
  - Live task status changes
- **Overdue Highlighting:**
  - Visual indicators for overdue tasks
- **Quick Actions:**
  - Quick status toggle
  - Edit task
  - Delete task
  - View project/lead details

---

### `/inventory` - Inventory Management
**Component:** `Inventory.jsx`

**Purpose:** Comprehensive warehouse management system with stock tracking, analytics, and low-stock alerts.

**CRUD Operations:**
- **CREATE:** Add new inventory items
- **READ:** View all inventory with analytics
- **UPDATE:** Edit item details, adjust stock levels
- **DELETE:** Delete inventory items

**Features & Information Displayed:**

**Inventory KPIs:**
- Total items in catalog
- Total stock value
- Low stock items count
- Out of stock items count
- Stock turnover rate

**Inventory Table:**
- Material name
- Category (Solar Panels, Inverters, Mounting, Cables, etc.)
- Current stock quantity
- Unit of measurement
- Unit cost
- Total value
- Reorder level
- Stock status (In Stock, Low Stock, Out of Stock)
- Last updated date

**Analytics Charts:**
- **Stock Value by Category:** Pie chart
- **Stock Levels:** Bar chart showing current vs reorder levels
- **Usage Trends:** Line chart showing material consumption over time
- **Low Stock Alerts:** Visual indicators

**Low Stock Alert Panel:**
- Items below reorder level
- Recommended reorder quantity
- Supplier information
- Quick reorder action

**Business Insights:**
- Most used materials
- Slow-moving stock
- Stock turnover analysis
- Cost optimization recommendations

**Material Form Modal (Add/Edit):**
- Material name
- Category selection
- Current stock quantity
- Unit of measurement
- Unit cost
- Reorder level
- Supplier details
- Notes

**Stock Adjustment Modal:**
- Adjust quantity (add/remove)
- Adjustment reason
- Adjustment date
- Notes

**Features:**
- **Tabs:**
  - Overview (KPIs and charts)
  - Inventory List (table)
  - Analytics (detailed charts)
  - Alerts (low stock notifications)
- **Filtering:**
  - By category
  - By stock status
  - Search by name
- **Export:**
  - CSV export with stock valuation
- **Real-time Updates:**
  - Live stock updates via Supabase
  - Auto-refresh on material allocation
- **Project Integration:**
  - View materials allocated to projects
  - Track material usage by project

---

### `/materials` - Materials Catalog
**Component:** `Materials.jsx`

**Purpose:** Master catalog of all available materials with pricing, specifications, and usage analytics.

**CRUD Operations:**
- **CREATE:** Add new materials to catalog
- **READ:** View all materials with analytics
- **UPDATE:** Edit material details and pricing
- **DELETE:** Delete materials (with usage check)

**Features & Information Displayed:**

**Material KPIs:**
- Total materials in catalog
- Total catalog value
- Most used material
- Average material cost
- Materials by category distribution

**Materials Table:**
- Material name
- Category
- Unit of measurement
- Standard unit cost
- Current stock (linked to inventory)
- Times used in projects
- Last used date
- Supplier information
- Specifications
- Status (Active/Inactive)

**Material Analytics:**
- **Usage Trends:** Line chart showing material usage over time
- **Cost Analysis:** Bar chart comparing material costs
- **Category Distribution:** Pie chart
- **Popular Materials:** Top 10 most used materials

**Insights Panel:**
- Cost-saving opportunities
- Alternative material suggestions
- Bulk purchase recommendations
- Price trend analysis

**Material Form Modal (Add/Edit):**
- Material name
- Category selection
- Unit of measurement
- Standard unit cost
- Detailed specifications
- Supplier name and contact
- Minimum order quantity
- Lead time for procurement
- Notes
- Active/Inactive status

**Features:**
- **Advanced Search:**
  - Search by name, category, supplier
  - Debounced search for performance
- **Filtering:**
  - By category
  - By active/inactive status
  - By usage frequency
- **Sorting:**
  - By name, cost, usage
  - Ascending/descending
- **Export:**
  - CSV export with specifications
- **Real-time Updates:**
  - Live material updates via Supabase
- **Inventory Integration:**
  - Direct link to inventory levels
  - Stock availability check
- **Project Integration:**
  - View projects using this material
  - Usage history

---

## 💰 Finance Management

### `/invoices` - Invoices Management
**Component:** `Invoices.jsx`

**Purpose:** Comprehensive billing system with invoice generation, payment tracking, and PDF export.

**CRUD Operations:**
- **CREATE:** Generate new invoices for projects
- **READ:** View all invoices with filtering and analytics
- **UPDATE:** Edit invoice details, update status
- **DELETE:** Delete individual or bulk invoices

**Features & Information Displayed:**

**Invoice KPIs:**
- Total invoices count
- Total invoiced amount
- Total paid amount
- Total outstanding
- Overdue amount
- Average invoice value

**Invoices Table:**
- Invoice number (auto-generated)
- Project name (linked)
- Client name
- Invoice amount
- Paid amount
- Outstanding balance
- Status (Draft, Sent, Paid, Partially Paid, Overdue, Cancelled)
- Issue date
- Due date
- Payment method
- Actions (View, Edit, Delete, Download PDF, Add Payment)

**Invoice Creation Modal:**
- Select project
- Invoice amount
- Issue date
- Due date
- Payment terms
- Notes
- Tax/GST calculation
- Line items (optional)

**Invoice Edit Modal:**
- Update amount
- Change due date
- Update status
- Add notes

**Invoice Preview Modal:**
- Full invoice preview
- Company branding
- Line items breakdown
- Payment terms
- Download PDF button

**Payment Drawer:**
- Add payment against invoice
- Payment amount
- Payment date
- Payment method (Cash, Bank Transfer, Cheque, UPI, Card)
- Transaction reference
- Notes
- View payment history
- Delete payments

**Features:**
- **Advanced Filtering:**
  - By status
  - By project
  - By date range
  - By payment status
- **Bulk Actions:**
  - Bulk delete
  - Bulk status update
  - Select all/individual
- **Export:**
  - CSV export with payment details
  - Custom column selection
- **PDF Generation:**
  - Professional invoice PDF
  - Company branding
  - Payment history
  - Outstanding balance
- **Payment Tracking:**
  - Track partial payments
  - Payment history per invoice
  - Auto-calculate outstanding
- **Real-time Updates:**
  - Live invoice updates via Supabase
  - Auto-refresh on payment addition
- **Overdue Detection:**
  - Auto-mark overdue invoices
  - Visual indicators
  - Overdue amount calculation

---

### `/payments` - Payments Recording
**Component:** `Payments.jsx`

**Purpose:** Record and track all incoming payments against invoices with reconciliation.

**CRUD Operations:**
- **CREATE:** Record new payments
- **READ:** View all payments with filtering
- **UPDATE:** Edit payment details
- **DELETE:** Delete individual or bulk payments

**Features & Information Displayed:**

**Payment KPIs:**
- Total payments count
- Total amount received
- Payments this month
- Average payment value
- Payment methods distribution

**Payments Table:**
- Payment ID
- Invoice number (linked)
- Project name
- Client name
- Payment amount
- Payment date
- Payment method (Cash, Bank Transfer, Cheque, UPI, Card)
- Transaction reference
- Notes
- Recorded by (user)
- Created date

**Payment Creation Modal:**
- Select invoice
- Payment amount (with outstanding validation)
- Payment date
- Payment method
- Transaction reference
- Notes
- Receipt number

**Payment Edit Modal:**
- Update amount
- Change payment date
- Update payment method
- Update transaction reference
- Add/edit notes

**Features:**
- **Filtering:**
  - By payment method
  - By project
  - By date range
  - By invoice
- **Search:**
  - Search by invoice number, transaction reference
- **Bulk Actions:**
  - Bulk delete
  - Select all/individual
- **Export:**
  - CSV export with invoice details
  - Excel export
- **Real-time Updates:**
  - Live payment updates via Supabase
  - Auto-update invoice status
- **Invoice Integration:**
  - Auto-link to invoices
  - Update invoice paid amount
  - Mark invoice as paid when fully paid
- **Reconciliation:**
  - Match payments to invoices
  - Outstanding balance tracking

---

### `/expenses` - Expenses Tracking
**Component:** `Expenses.jsx`

**Purpose:** Track all project-related expenses for accurate profitability calculation.

**CRUD Operations:**
- **CREATE:** Record new expenses
- **READ:** View all expenses with filtering
- **UPDATE:** Edit expense details
- **DELETE:** Delete individual or bulk expenses

**Features & Information Displayed:**

**Expense KPIs:**
- Total expenses count
- Total amount spent
- Expenses this month
- Average expense value
- Expenses by category distribution

**Expenses Table:**
- Expense ID
- Project name (linked)
- Category (Materials, Labor, Travel, Equipment, Utilities, Other)
- Description
- Amount
- Expense date
- Payment method
- Receipt/Invoice number
- Vendor/Supplier
- Notes
- Recorded by (user)
- Created date

**Expense Creation Modal:**
- Select project
- Select category
- Description
- Amount
- Expense date
- Payment method
- Receipt/invoice number
- Vendor/supplier name
- Upload receipt (optional)
- Notes

**Expense Edit Modal:**
- Update all fields
- Change project association
- Update amount
- Edit notes

**Features:**
- **Filtering:**
  - By project
  - By category
  - By date range
  - By payment method
- **Search:**
  - Search by description, vendor
- **Bulk Actions:**
  - Bulk delete
  - Select all/individual
- **Export:**
  - CSV export with project details
- **Real-time Updates:**
  - Live expense updates via Supabase
  - Auto-update project profitability
- **Project Integration:**
  - Auto-link to projects
  - Update project total expenses
  - Affect profit calculations
- **Receipt Management:**
  - Upload receipt images
  - Store receipt numbers
  - Vendor tracking
- **Category Analytics:**
  - Expense breakdown by category
  - Category-wise trends

---

## 👥 HR & Team Management

### `/employees` - Employees Management
**Component:** `Employees.jsx`

**Purpose:** Comprehensive HR system for managing team members with task assignment and performance tracking.

**CRUD Operations:**
- **CREATE:** Add new employees
- **READ:** View all employees with analytics
- **UPDATE:** Edit employee details
- **DELETE:** Delete employees (with task reassignment check)

**Features & Information Displayed:**

**Employee Analytics:**
- Total employees count
- Employees by role distribution
- Active tasks count
- Completed tasks count
- Average tasks per employee
- Task completion rate

**Employees Table:**
- Employee name
- Role (Technician, Sales, Manager, Admin, Support)
- Email
- Phone
- Active tasks count
- Completed tasks count
- Join date
- Status (Active/Inactive)
- Actions (View, Edit, Delete, Assign Task)

**Employee Modal (Add/Edit):**
- Full name
- Role selection
- Email
- Phone
- Address
- Join date
- Salary (optional)
- Notes
- Status (Active/Inactive)

**Task Management Section:**
- **All Tasks View:**
  - Task description
  - Assigned employee
  - Project/Lead linked
  - Status
  - Priority
  - Due date
  - Completion date
- **Create Task:**
  - Assign to employee
  - Link to project or lead
  - Set priority and due date
- **Bulk Task Actions:**
  - Mark multiple as done/pending
  - Bulk delete
  - Bulk reassign

**Features:**
- **Tabs:**
  - Employees List
  - Tasks Overview
  - Analytics
- **Filtering:**
  - By role
  - By status (active/inactive)
  - By task load
- **Search:**
  - Search by name, email, phone
- **Export:**
  - CSV export with task statistics
- **Real-time Updates:**
  - Live employee updates via Supabase
  - Real-time task assignments
- **Task Integration:**
  - View employee workload
  - Task completion tracking
  - Performance metrics
- **Analytics Charts:**
  - Tasks by employee
  - Completion rates
  - Workload distribution

---

### `/admins` - Admin Users (Protected)
**Component:** `Admins.jsx`

**Purpose:** Manage system administrators with role-based access control (Admin-only route).

**CRUD Operations:**
- **CREATE:** Invite new admins (manual process)
- **READ:** View all admin users
- **UPDATE:** Activate/deactivate admin accounts
- **DELETE:** Not implemented (deactivate instead)

**Features & Information Displayed:**

**Admin Users Table:**
- Name (or "Awaiting Signup" if not confirmed)
- Email
- Role (Admin, Super Admin)
- Verified status (Yes/No)
- Account status:
  - "Ready for Approval" (signed up but not activated)
  - "Active/Linked" (active admin)
  - "Pending Signup" (invited but not signed up)
- Access level
- Added on date
- Actions (Verify/Revoke/Enable)

**Features:**
- **Real-time Updates:**
  - Live admin status changes via Supabase
- **Access Control:**
  - Activate pending admin accounts
  - Revoke admin access
  - Enable disabled accounts
- **Verification Workflow:**
  - Admin signs up
  - Appears as "Ready for Approval"
  - Super admin verifies
  - Account activated
- **Security:**
  - Role-based access (only admins can access)
  - Audit trail of admin actions

---

## 📊 Reports & Analytics

### `/reports` - Advanced Reports
**Component:** `Reports.jsx`

**Purpose:** Comprehensive analytics and reporting system with customizable filters, presets, and multi-format export.

**CRUD Operations:**
- **READ:** Fetch global analytics data
- **CREATE:** Save custom report presets, add report notes
- **DELETE:** Delete saved presets

**Features & Information Displayed:**

**Global Analytics Dashboard:**

**KPI Cards:**
- Total Revenue
- Total Leads
- Active Projects
- Total Expenses
- Net Profit
- Profit Margin %
- Conversion Rate
- Average Deal Value

**Advanced Filtering:**
- Date range picker (preset ranges: Today, This Week, This Month, This Year, Custom)
- Project status filter
- Lead status filter
- Employee filter
- Source filter
- Campaign filter

**Analytics Tabs:**

1. **Overview Tab:**
   - Revenue trends (line chart)
   - Expense trends (line chart)
   - Profit trends (area chart)
   - Lead acquisition trends
   - Project completion trends

2. **Sales Analytics:**
   - Lead funnel visualization
   - Conversion rates by stage
   - Lead source performance
   - Sales by employee
   - Win/loss analysis

3. **Financial Analytics:**
   - Revenue breakdown by project
   - Expense breakdown by category
   - Profit margins by project
   - Payment collection trends
   - Outstanding invoices analysis
   - Cash flow analysis

4. **Project Analytics:**
   - Projects by status
   - Projects by solar type
   - Capacity installed (kW)
   - Project timeline analysis
   - Completion rate
   - Delayed projects

5. **Inventory Analytics:**
   - Stock levels by category
   - Material usage trends
   - Stock value analysis
   - Low stock alerts
   - Material cost trends

6. **Employee Analytics:**
   - Tasks by employee
   - Completion rates
   - Workload distribution
   - Performance metrics

7. **Marketing Analytics:**
   - Campaign performance
   - ROI by campaign
   - Cost per lead by source
   - Geographic distribution
   - Platform comparison

**Report Presets:**
- Save current filter configuration
- Quick load saved presets
- Share presets with team
- Delete presets

**Report Notes:**
- Add annotations to reports
- Date-stamped notes
- Collaborative notes
- Note history

**Export Options:**
- **PDF Export:**
  - Professional report layout
  - All charts and tables
  - Company branding
  - Date range and filters applied
- **Excel Export:**
  - Multi-sheet workbook
  - Raw data + charts
  - Formatted tables
- **CSV Export:**
  - Raw data export
  - Custom column selection

**Features:**
- **Real-time Data:**
  - Live updates via Supabase
  - Auto-refresh on data changes
- **Interactive Charts:**
  - Hover tooltips
  - Click to drill down
  - Zoom and pan
- **Customization:**
  - Choose metrics to display
  - Customize chart types
  - Set comparison periods
- **Insights:**
  - AI-powered recommendations (placeholder)
  - Trend analysis
  - Anomaly detection
- **Collaboration:**
  - Share reports via link
  - Export and email
  - Scheduled reports (future feature)

---

## 🔐 Authentication

### `/login` - Login Page
**Component:** `Login.jsx`

**Purpose:** Secure authentication entry point with Supabase Auth integration.

**Features:**
- Email/password authentication
- Remember me functionality
- Password reset flow
- Error handling
- Redirect to dashboard on success
- Futuristic glassmorphism UI
- Mobile-responsive design

---

## Key Features Across All Pages

### 🔄 Real-time Updates
All pages implement Supabase real-time subscriptions for live data updates:
- Automatic refresh on database changes
- Multi-user collaboration support
- Instant notifications
- No manual refresh needed

### 📱 Mobile-First Design
- Responsive layouts for all screen sizes
- Touch-optimized interactions
- Mobile navigation (bottom bar)
- Adaptive tables (horizontal scroll on mobile)
- Collapsible filters and panels

### 🎨 Glassmorphism UI
- Dark mode with neon accents
- Frosted glass effects
- Smooth animations (Framer Motion)
- Consistent design language
- Accessibility-friendly

### 📊 Export Capabilities
Most pages support multiple export formats:
- CSV export with custom columns
- Excel export with formatting
- PDF generation with branding
- JSON export for data analysis

### 🔍 Advanced Filtering & Search
- Multi-criteria filtering
- Debounced search
- Date range pickers
- Saved filter presets
- Quick filter reset

### ⚡ Performance Optimization
- RTK Query caching
- Pagination for large datasets
- Lazy loading
- Optimistic UI updates
- Debounced inputs

### 🔒 Security
- Role-based access control
- Protected routes
- Row-level security (Supabase RLS)
- Secure authentication
- Audit trails

---

## Database Schema Overview

The application uses Supabase (PostgreSQL) with the following main tables:

- **leads** - Customer leads and prospects
- **projects** - Solar installation projects
- **invoices** - Billing and invoices
- **payments** - Payment records
- **expenses** - Project expenses
- **inventory** - Stock management
- **materials** - Materials catalog
- **employees** - Team members
- **tasks** - Task assignments
- **quotations** - Price quotations
- **lead_sources** - Lead acquisition channels
- **campaigns** - Marketing campaigns
- **notifications** - System notifications
- **admin_users** - System administrators
- **business_settings** - Application configuration

All tables include:
- Timestamps (created_at, updated_at)
- Soft delete support
- Audit fields
- Foreign key relationships
- Indexes for performance

---

## Future Enhancements

- Email integration for invoices and quotations
- SMS notifications
- Advanced reporting with AI insights
- Mobile app (React Native)
- Customer portal
- Document management
- Calendar integration
- WhatsApp integration
- Payment gateway integration
- Automated workflows
- Custom dashboards
- Multi-language support
