# Changelog

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document tracks all version changes, feature additions, bug fixes, and breaking changes across the project lifecycle.

---

## [Unreleased]

### In Progress
- Authentication system (register, forgot password, reset password)
- Admin pending user approval workflow

---

## [0.1.0] - Initial Setup

### Added
- Project folder structure created
- Client setup with React + Vite + TypeScript + Tailwind CSS
- Server setup with Node.js + Express + Prisma
- PostgreSQL database configured
- Prisma schema defined with core entities

### Core Modules Delivered
- Login page (auth.jsx)
- Admin panel (admin.jsx)
- Admin products management
- Admin categories management
- Admin users management
- Admin payment methods management
- Admin bookings management
- Admin reports dashboard
- POS terminal (pos.index.jsx)
- POS orders view
- POS customers view
- POS tables view
- Kitchen Display System (kds.jsx)
- Real-time order sync via Socket.io

### Database Tables Created
- users
- categories
- products
- payment_methods
- floors
- tables
- coupons
- promotions
- customers
- sessions
- orders
- order_items
- kitchen_orders
