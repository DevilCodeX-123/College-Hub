# 🎓 Campus Hub – The Ultimate University Super App

**Version:** 1.0
**Status:** Active Development (Beta)
**Tech Stack:** MERN (MongoDB, Express, React, Node.js) + TypeScript + Vite

---

## 🚀 Overview

**Campus Hub** is a full-scale **campus super-application** designed to centralize and gamify university life.
It brings together **clubs, events, hackathons, academic projects, tasks, and campus resources** into a single, role-based ecosystem.

Built with scalability and modern UX in mind, Campus Hub operates inside isolated **College Bubbles**, ensuring data separation and security across institutions.

---

## ✨ Core Principles

* 🎮 **Gamification First**
  Every meaningful action earns XP, levels, and badges to drive engagement.

* 🧊 **Glassmorphism UI**
  A premium UI with blur effects, gradients, smooth animations, and micro-interactions.

* 🏫 **One Campus, One Platform**
  From club management to smart campus utilities—everything under one login.

---

## 🛠️ Tech Stack & Architecture

### Frontend

* **React 18 + Vite**
* **TypeScript**
* **State Management**

  * TanStack Query (Server State)
  * React Context (Auth & User State)
* **UI & Styling**

  * Tailwind CSS
  * Shadcn UI
  * Lucide React Icons
  * Framer Motion (Animations)
* **Routing:** React Router v6

### Backend

* **Node.js + Express**
* **MongoDB Atlas (Mongoose ORM)**
* **Authentication**

  * JWT-based Auth
  * Custom RBAC Middleware (`auth`, `admin`, `owner`)
* **File Storage**

  * Cloudinary (Production)
  * Local Storage (Development)

---

## 🎨 Design System – *Future Academy Theme*

### Color Palette

| Purpose     | Color               |
| ----------- | ------------------- |
| Primary     | `#6366f1` (Indigo)  |
| Accent      | `#0ea5e9` (Cyan)    |
| Success     | `#10b981` (Emerald) |
| Warning     | `#f59e0b` (Amber)   |
| Destructive | `#f43f5e` (Rose)    |

**UI Patterns**

* Hover scale & lift animations
* Custom loaders for async states
* Illustrated empty states with CTA
* Glass cards with backdrop blur

---

## 🔐 Role-Based Access Control (RBAC)

| Role             | Level | Description            |
| ---------------- | ----- | ---------------------- |
| Owner            | 100   | Global super admin     |
| College Admin    | 10    | College-level control  |
| Club Coordinator | 8     | Club owner / president |
| Core Member      | 4     | Club officers          |
| Club Member      | 2     | Verified club member   |
| Student          | 1     | Basic verified user    |

---

## 🧩 Features

### 🔑 Authentication & Onboarding

* Email & Password login
* College selection
* Academic details (Branch, Year)
* Avatar support
* Secure password hashing (Bcrypt)

---

### 👤 User Profile & Gamification

* Professional profile (**Dossier**)
* XP-based leveling system
* System & Club badges
* Stats dashboard
* Profile & security settings

---

### 🏷️ Clubs Module

* Club discovery with search & filters
* Detailed club pages
* Join request workflow
* Events, challenges & members tabs
* Members-only real-time chat

---

### 🛡️ Owner & Admin Dashboards

* Global user management
* Role editing & bans
* College-specific data views
* Approval workflows

---

### 🧠 Challenges & Hackathons

* Multi-phase challenges
* XP-based rewards
* Submission & grading system
* Feedback, marks & instant badges

---

### 💼 Project Marketplace

> *LinkedIn + Jira for students*

* Discover open projects
* Task-based workspace (**Cockpit**)
* Progress tracking
* Team chat & shared resources
* Skill-based join approvals

---

### 📅 Events Manager

* Upcoming → Active → Completed lifecycle
* Individual / Team registration
* Paid event QR upload
* Feedback polls & XP distribution

---

### 🏫 Smart Campus

* Notes repository (PDFs & links)
* Moderated uploads
* Live campus map
* Real-time crowd status (Busy / Free / Full)

---

### ✅ Internal Task Management

* Core-team-only access
* Daily task assignments
* Review & approval flow
* Auto XP rewards

---

## 🗄️ Database Models (Sample)

### User

```json
{
  "name": "String",
  "email": "String",
  "role": "Enum",
  "college": "String",
  "xp": "Number",
  "points": "Number",
  "badges": [],
  "skills": []
}
```

### Club

```json
{
  "name": "String",
  "coordinator": "UserID",
  "members": [],
  "coreTeam": []
}
```

### Challenge

```json
{
  "title": "String",
  "clubId": "ObjectId",
  "phases": [],
  "submissions": []
}
```

---

## 🛣️ Roadmap (Post v2.0)

* 📄 Resume Generator
* 🔔 Notification System
* 🏆 Global Inter-College Leaderboards

---

## 🧪 Status

Campus Hub is currently in **Beta** and under active development.
Contributions, feedback, and feature ideas are welcome.

---

### 🧠 Built With Vision
**Campus Hub** is not just an app—it's a **digital campus ecosys
