# Project Description:  NearMitra — Hyperlocal Home Services Platform

## 1. Project Overview
 NearMitra is a full-stack, hyper-local services marketplace designed to seamlessly connect customers with trusted local service providers (like electricians, plumbers, carpenters, etc.). The platform provides an end-to-end booking and fulfillment experience with specialized portals for three distinct user roles: Customers, Service Providers, and Administrators.

The primary goal of  NearMitra is to digitize and standardize unorganized home services, making it easy for users to find help, while giving providers a digital suite to manage their jobs, capture evidence of work, and track payments.

## 2. Platform Architecture & Tech Stack

The application is built using a modern, scalable web architecture:

### Frontend
- **Framework:** React 18 with TypeScript and Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Routing:** React Router DOM (v6)
- **State Management:** React Query (TanStack Query v5) for server state handling
- **Form Handling:** React Hook Form + Zod (for validation)
- **Icons & Graphics:** Lucide React, Embla Carousel
- **Internationalization (i18n):** Custom translation context supporting English, Hindi, and Marathi.

### Backend (BaaS)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Email/Password, Roles)
- **Storage:** Supabase Storage (for before/after job photos)
- **Realtime:** Supabase realtime subscriptions for instant status updates/notifications

### AI Integration
- **Generative AI:** Google Gemini API integrated via Supabase Edge Functions for an intelligent AI Chatbot to assist users.

## 3. Core Features & Modularity 

The application is structured around discrete modules catering to different actors:

### 3.1 Customer Features & UI Functionalities
- **Multi-language Interface:** Customers can toggle the application language between English, Hindi, and Marathi.
- **Dynamic Service Grid:** The homepage (`Index.tsx`) and Services page (`Services.tsx`) render a dynamic list of available services extracted directly from the database.
- **Service Booking Workflow (`BookService.tsx`):**
  - Intuitive multi-step form built with `react-hook-form`.
  - Date and time selection using `react-day-picker`.
  - Comprehensive address and contact information capture.
  - Automated dynamic pricing display based on the selected service.
- **Booking Tracking (`TrackBooking.tsx`):** Customers can log in to view past and active bookings. Statuses (e.g., Pending, Approved, In Progress, Completed) update in real-time.
- **AI Chatbot Assistant (`AIChatBot.tsx`):** A floating AI assistant interface that can help users navigate the platform or answer basic service-related queries.

### 3.2 Service Provider Portal
- **Provider Registration & Login (`ProviderLogin.tsx`):** Secure authentication restricted specifically to provider accounts.
- **Job Management Dashboard (`ProviderDashboard.tsx`):**
  - Providers view an assigned queue of jobs.
  - Ability to Accept or Reject pending assignments.
- **On-site Verification & Camera Integration (`CameraCapture`):** 
  - Providers must capture "Before" and "After" photos using their device's live camera (implemented via HTML5 Media API).
  - Images are securely uploaded to Supabase Storage and linked to the booking record.
- **Job Completion & Payment Recording:** Providers can mark jobs as complete and record payment details directly from the field.

### 3.3 Administrator Dashboard
- **Admin Authentication (`AdminLogin.tsx`):** Controlled access portal for platform owners.
- **Global Dashboard (`AdminDashboard.tsx`):**
  - **Booking Management:** Admins can view all incoming bookings across the platform.
  - **Provider Assignment:** Admins manually assign pending bookings to registered service providers.
  - **Provider Verification:** A robust system to manage and approve new service provider registrations.
  - **Analytics:** High-level views of booking history, system status, and earnings.

## 4. UI/UX Design & Aesthetics
- **Design System:** The UI leverages the "Obsidian Luxe" design system setup via Tailwind CSS, offering a hyper-modern, premium, and vibrant aesthetic. It uses custom fonts, dark/light modes, gradients, and subtle micro-animations to enhance the user experience.
- **Responsive Layout:** Complete mobile-first design, ensuring the platform works flawlessly on smartphones (crucial for Service Providers in the field) and scales up to desktop dashboards for Admins.
- **Notifications & Feedback:** Toast notifications (`sonner`) and standard alerts provide immediate feedback for actions like successful bookings, form errors, or authentication events.

## 5. Database Schema (PostgreSQL via Supabase)
While abstracted from the frontend, the core relational tables include:
- `profiles` (User metadata and role definitions: customer, provider, admin)
- `services` (Dynamic list of platform offerings, prices, and imagery)
- `bookings` (Core transactional table tracking service requests, statuses, provider assignments, and pricing)
- `notifications` (System handling real-time alerts for booking updates and provider approvals)

## 6. How it all connects (The Workflow)
1. **Request:** A user browses the service catalog, selects a service, fills in details, and submits a booking.
2. **Assignment:** The Admin dashboard receives the booking in real-time. The Admin reviews and assigns it to an available Service Provider.
3. **Execution:** The Provider logs in, accepts the job, arrives on-site, snaps a "Before" photo, performs the work, snaps an "After" photo, and marks the job as complete.
4. **Resolution:** The Customer can track this entire state transition in real-time. Notifications are triggered at key milestones.
