# Solar Project Admin Panel

## Overview
This project is a modern, high-performance Admin Dashboard designed for managing solar installation projects. It features a futuristic "Glassmorphism" UI with neon accents, fully responsive design for mobile and desktop, and a robust set of features for managing leads, projects, finances, and inventory.

## Recent Enhancements (Phases 1-6)
We have recently executed a major overhaul of the application, focusing on:
*   **UI/UX Redesign:** Implemented a dark-mode first, glassmorphism aesthetic with Tailwind CSS and Framer Motion.
*   **Mobile-First Architecture:** Completely rebuilt the navigation with a `MobileNav` bottom bar and a responsive `Sidebar`, ensuring full functionality on all device sizes.
*   **Critical Bug Fixes:** Resolved schema mismatches in the `Projects` module (handling `project_status` constraints and missing columns) and fixed UI crashes in `ProjectDetails`.
*   **Performance:** Optimized component rendering and state management with Redux Toolkit and RTK Query.

## Application Routes & Page Documentation

The application is structured into several key functional modules. Below is a detailed breakdown of every route defined in `src/App.jsx` and its functionality.

### 🏠 Core Dashboard
| Route | Component | Description |
| :--- | :--- | :--- |
| `/dashboard` | `Dashboard.jsx` | **Central Hub.** Displays high-level business intelligence including: <br>• **Real-time KPIs:** Total Revenue, Active Projects, New Leads. <br>• **Visualizations:** Revenue trends and project status distribution charts. <br>• **Profit Calculator:** Estimates margins by comparing Total Invoiced vs. Total Expenses. |
| `/notifications` | `Notifications.jsx` | **System Alerts.** A centralized feed for important updates such as: <br>• Low stock alerts for inventory materials. <br>• New lead assignments. <br>• Overdue tasks or invoices. |
| `/settings` | `Settings.jsx` | **Configuration.** allows users to manage their profile, application preferences, and system-wide settings. |

### 👥 CRM & Sales
| Route | Component | Description |
| :--- | :--- | :--- |
| `/leads` | `Leads.jsx` | **Lead Management.** The primary interface for tracking potential customers. Features: <br>• **Kanban & List Views:** Toggle between a drag-and-drop pipeline or a detailed data table. <br>• **Bulk Actions:** Select multiple leads to delete or update status. |
| `/lead-sources` | `LeadSources.jsx` | **Acquisition Analytics.** Tracks the origin of leads (e.g., Facebook, Referrals, Google Ads) to identify the most effective marketing channels. |
| `/campaigns` | `Campaigns.jsx` | **Marketing Management.** Monitor marketing campaigns, tracking budgets, platforms, and duration (Start/End dates). |
| `/quotations` | `Quotations.jsx` | **Price Quotes.** Create and send official price quotations to leads. <br>• **Status Tracking:** Mark quotes as Pending, Accepted, or Rejected. <br>• **Validation:** Ensures quotes have valid amounts and expiration dates. |

### 🛠️ Projects & Operations
| Route | Component | Description |
| :--- | :--- | :--- |
| `/projects` | `Projects.jsx` | **Project Portfolio.** A comprehensive list of all solar installations. <br>• **Filtering:** Filter by status (Ongoing, Completed, Cancelled). <br>• **Creation:** "New Project" modal with validation for fields like `Capacity (kW)` and `Solar Type`. |
| `/projects/:id` | `ProjectDetails.jsx` | **Project Command Center.** A detailed view for a single project, divided into tabs: <br>• **Overview:** Client info, system size, and installation address. <br>• **Financials:** Project-specific P&L (Invoices vs Expenses). <br>• **Materials:** List of allocated hardware. <br>• **Tasks:** Installation steps and completion status. |
| `/tasks` | `Tasks.jsx` | **Global Task Board.** View and manage installation tasks across ALL projects. Assign tasks to specific employees and track completion. |
| `/inventory` | `Inventory.jsx` | **Warehouse Management.** Track stock levels of solar panels, inverters, and mounting hardware. Includes visual indicators for low stock. |
| `/materials` | `Materials.jsx` | **Catalog Management.** Define the master list of available materials, including their standard unit costs and specifications. |

### 💰 Finance
| Route | Component | Description |
| :--- | :--- | :--- |
| `/invoices` | `Invoices.jsx` | **Billing.** Generate professional invoices for projects. <br>• **PDF Generation:** Download invoices as PDF files. <br>• **Tracking:** Monitor payment status (Paid/Unpaid/Overdue). |
| `/payments` | `Payments.jsx` | **Revenue Recording.** Log incoming payments against specific invoices to keep financial records accurate. |
| `/expenses` | `Expenses.jsx` | **Cost Tracking.** Record project-related expenses (e.g., equipment purchase, labor, travel) to calculate true project profitability. |

### 👥 HR & Administration
| Route | Component | Description |
| :--- | :--- | :--- |
| `/employees` | `Employees.jsx` | **Team Management.** Manage employee profiles, roles (Technician, Sales, Manager), and contact information. |
| `/admins` | `Admins.jsx` | **Access Control (Admin Only).** A protected route for managing system administrators. functionalities include inviting new admins and managing role-based access levels. |

### 🔐 Authentication
| Route | Component | Description |
| :--- | :--- | :--- |
| `/login` | `Login.jsx` | **Secure Entry.** Futuristic login screen handling user authentication via Supabase Auth. |

## Technical Stack
*   **Frontend:** React, Vite, Tailwind CSS
*   **State Management:** Redux Toolkit, RTK Query
*   **Database:** Supabase (PostgreSQL)
*   **UI Components:** Lucide React Icons, Shadcn UI (customized)
