# Erlinshop Project Handoff - Brain Manifest

> [!IMPORTANT]
> This document is the **Single Source of Truth** for the project's architecture, business logic, and development standards. Read this entirely before writing any code.

## 1. Project Overview & Tech Stack
Erlinshop is a premium, spec-driven e-commerce platform designed with a "Zalora DNA" aesthetic. It prioritizes a frictionless user experience and high-fidelity product data.

- **Core Framework:** Next.js 15 (App Router)
- **Data Layer:** Drizzle ORM (PostgreSQL)
- **Database:** Neon Postgres (WebSocket driver for Serverless consistency)
- **Logic Handling:** Next.js Server Actions
- **Auth:** 
  - **Admin:** Clerk (Management & Analytics)
  - **Client:** Frictionless Guest CRM (Silent Session via HttpOnly Cookies)
- **Styling:** Vanilla CSS + TailwindCSS v4 (Glassmorphism & High-Contrast)
- **Assets:** Cloudinary (Unsigned upload for product images)
- **Messaging:** Sonner (Toast notifications for all feedback)

## 2. Database Architecture & Schema
The database is designed to handle complex product variants and hierarchical structures.

### Key Entities
- **`categories`:** Supports recursive hierarchy via `parentId`. Contains `specifications` (JSONB) defining which attributes (e.g., "Size", "Color") are required for products in that category.
- **`products`:** Root product entity. Contains `specs` (JSONB) for shared technical details.
- **`product_variants`:** Atomic SKU units. Contains `attributes` (JSONB) storing specific values (e.g., `{"Color": "Black", "Size": "XL"}`) and variant-specific `stock`/`price`.
- **`customers`:** CRM record linked via `phoneNumber`. Used for Guest CRM tracking.
- **`orders` & `order_items`:** Lifecycle-managed transaction records.

### Spec-Driven Architecture
The platform is "Spec-Driven". Category-level metadata dictates product-level attributes. This ensures data purity and enables advanced filtering.

## 3. Core Business Logic (The Engines)

### Finite State Machine (Orders)
Orders follow a strict 4-state lifecycle:
1. **`PENDING`**: Initial state. Customer has checked out.
2. **`PROCESSING`**: Admin has approved the order. Production/Prep starts.
3. **`COMPLETED`**: Order fulfilled. **Triggers Stock Decrement (-)**.
4. **`CANCELLED`**: Order terminated. **Triggers Stock Increment (+)** if moving from `COMPLETED`.

### Atomic Inventory Lifecycle
Stock movements are gated by state transitions in `updateOrderStatus` action:
- **Decrement:** Occurs ONLY on `PROCESSING` -> `COMPLETED`.
- **Increment:** Occurs ONLY on `COMPLETED` -> `CANCELLED`.
- **Transition Guard:** Prevents illegal jumps (e.g., `PENDING` directly to `COMPLETED`).

### Frictionless CRM & Tracking
- **Silent Auth:** No login required for customers. A `guest_session` (HttpOnly Cookie) is set post-checkout, valid for 30 days.
- **Order Tracking:** Accessible via `/profile`. Uses `phoneNumber` + `orderId` for verification if session is missing.

## 4. Strict Development Rules (Hukum Mutlak)

### Rule #1: Strict DB Purity
- Drizzle ORM is the **Single Source of Truth**.
- **NEVER** use raw SQL patches via Neon/DB Dashboard.
- **Workflow:** Update schema -> `npx drizzle-kit generate` -> `npx drizzle-kit push`.

### Rule #2: 3-Layer Architecture
1. **UI Layer:** (`/components` & `/app` pages). Pure rendering. No business logic or math.
2. **Logic Layer:** (`/app/actions`). "Otak" system. Handles calculations, auth, and DB transactions.
3. **Data Layer:** (`/db/schema`). Defines the contract.

### Rule #3: Zalora DNA UX
- **Design:** High-contrast (Black/White), 4xl-rounded corners, glassmorphism.
- **Mobile-First:** Prioritize the **Bottom Navigation** experience.
- **Aspect Ratio:** Product images MUST use **3:4 Portrait Ratio**.
- **No Native Modals:** Do NOT use `window.alert`, `window.confirm`, or `prompt`. Use **Sonner** for all UI feedback.

## 5. Strict Development Rules (Advanced)

### Rule #4: Form Hijack Protection
- **NEVER** use `<button>` without `type="button"` inside a form unless it is the primary submit button.
- Default `<button>` behavior in HTML/React is `type="submit"`, which will trigger form actions unintentionally (e.g., clicking a "Close Modal" or "Add Image" button might submit the product form).

### Rule #5: Asset Stability
- **Image Cropping:** Use `ReactCrop` with the calibrated `getCroppedImg` utility (located in `src/lib/image-utils.ts`) to ensure 3:4 portrait ratio consistency.
- **Batch Processing:** Use `BatchImageUpload` for multi-asset products to ensure UI responsiveness during large uploads.

### Hero Slider Branding
- **Dynamic Carousel:** Supports up to 3 high-fidelity Hero images with unique branding per slide.
- **Data Persistence:** Stored in the `settings` table as `jsonb` under `heroImages`.
- **Intelligent Migration:** The system automatically migrates legacy `string[]` image arrays into the new metadata-rich format `{ url, title, subtitle }`.
- **Frontend Sync:** `Hero` component uses CSS Scroll Snap and auto-playing interval with memory-safe cleanup.

## 6. Current Implementation State
- **Phase 14.5 Completed:** Hero Slider Branding & Admin Settings stabilization.
- **Build Status:** Verified. `npm run build` passes with zero TypeScript errors.
- **System Stability:** High. Data migration logic for legacy hero images is robust and non-destructive.

---
*Signed by: Antigravity AI (Lead Architect)*
*Last Updated: 2026-05-11*
