# Klader Business Dashboard ৳ BDT

An enterprise-grade Business Management ERP Dashboard designed for **Klader**, a luxury fashion and clothing brand in Bangladesh.

---

## 🎨 Branding & Style Design
* **Primary Theme**: Crisp premium white layout with soft, luxury corner radial gradients inspired by the company logo colors.
* **Palette**:
  * **Maroon / Burgundy**: `#7b0a1c` (Primary Accent)
  * **Crimson**: `#b6142c` (Interactive Highlights)
  * **Peach / Coral**: `#e77e4e` (Soft Secondary Alerts)
  * **Slate / Charcoal**: `#161f28` (Text & Deep Neutrals)
* **Glassmorphism**: Semi-transparent card panels, blur backdrops, and soft shadow styles.
* **Typography**: Elegant heading elements utilizing *Outfit* Google font paired with *Inter* for interface reading.
* **Currency**: Styled exclusively for Bangladeshi Taka (`৳` BDT).

---

## 🔐 Credentials & Roles
This app enforces strict role-based access control (RBAC). The following default accounts are seeded in the database:

### 1. Main Admin (Full System Access)
* **Username**: `Zadid`
* **Password**: `Zadu00789`
* *Privileges*: Full read-write CRUD for all products, partners, expenses, sales invoices, user accounts, and request authorizations.

### 2. Partner / Investor
* **Username**: `partner_sajjad`
* **Password**: `sajjad123`
* *Privileges*: View their own investment profile, request withdrawals/investments, view their own dividend shares. No access to other partner profiles or admin settings.

### 3. Staff / Sales Manager
* **Username**: `staff_tamim`
* **Password**: `tamim123`
* *Privileges*: CRUD access to products and sales orders. Restricted from partner logs, expenses, or admin setups.

### 4. Viewer (Read-only)
* **Username**: `viewer_rahim`
* **Password**: `rahim123`
* *Privileges*: Can only view dashboard analytics and lists. Blocked from adding, editing, or deleting.

---

## 💾 Database Architecture (Dual Storage Mode)
The application has a zero-configuration hybrid database adapter in [db.js](file:///c:/Users/Zadid/Desktop/Klader%202.0/lib/db.js):
1. **Local Development (Default)**: Automatically creates and reads/writes to `data/db.json` when `DATABASE_URL` is omitted. Seed data is populated instantly.
2. **Production (PostgreSQL)**: Seamlessly connects to a PostgreSQL instance if `DATABASE_URL` is defined in `.env` or Hostinger environment configuration. Tables and seed data are auto-created on startup.

---

## 🚀 Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Optional: Define to connect to PostgreSQL in production
DATABASE_URL=postgresql://username:password@hostname:5432/dbname?sslmode=require
JWT_SECRET=your_secret_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Compiling Production Build
Verify code compiles without syntax errors:
```bash
npm run build
```

---

## ☁️ Hostinger Production Deployment Guide

To deploy this project to your domain **klader.life** using GitHub integration:

1. **Push Changes to GitHub**:
   Ensure the codebase is pushed to your repository:
   `https://github.com/MangusKarim/klader2.0.git`

2. **Hostinger Panel Setup**:
   * Navigate to the **Hostinger hPanel** → **Node.js** application setting.
   * Point your application to the domain `klader.life`.
   * Under **Git Integration**, connect your repository `https://github.com/MangusKarim/klader2.0.git` and select the `main` branch.

3. **Set Environment Variables**:
   Under hPanel's Node.js Environment variables section, add:
   * `NODE_ENV` = `production`
   * `JWT_SECRET` = `<Generate a secure 32-character string>`
   * `DATABASE_URL` = `<Your PostgreSQL connection string>`

4. **Install & Build on hPanel**:
   * Click **Install Dependencies** (runs `npm install`).
   * Trigger the build script by executing:
     `npm run build`
   * Set the Start script to:
     `npm run start`

5. **SSL & Security**:
   Ensure **Force HTTPS** is active in the Hostinger domain setup to protect JWT cookies.
