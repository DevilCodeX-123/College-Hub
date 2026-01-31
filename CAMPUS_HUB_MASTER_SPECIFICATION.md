# CAMPUS HUB: The Ultimate Master Specification

**Version:** 2.0
**Project Status:** Active Development / Beta
**Tech Stack:** MERN (MongoDB, Express, React, Node.js) with TypeScript & Vite.

---

## 1. Executive Summary
**Campus Hub** is a "Super App" for university campuses. It unifies disjointed student activities—clubs, hackathons, academic projects, events, and campus resources—into a single **gamified** platform. It uses a **Role-Based Access Control (RBAC)** system to serve Students, Club Coordinators, College Admins, and Owners within distinct "College Bubbles."

### Core Philosophy
*   **Gamification First:** Every action (joining a club, attending an event) earns XP. Levels and Badges drive engagement.
*   **Glassmorphism Aesthetic:** A premium, modern UI with polished gradients, translucency, and micro-interactions.
*   **Centralized Ecosystem:** One login for everything from checking lab occupancy to submitting a hackathon project.

---

## 2. Technology & Architecture

### Frontend
*   **Framework:** React 18 + Vite
*   **Language:** TypeScript
*   **State Management:** TanStack Query (Server State), React Context (Auth State).
*   **Styling:**
    *   **Tailwind CSS:** Utility-first styling.
    *   **Shadcn UI:** Accessible component primitives (Dialogs, Tabs, Inputs).
    *   **Lucide React:** Iconography.
    *   **Framer Motion:** Animations (Page transitions, hover effects).
*   **Routing:** React Router v6.

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB Atlas (Mongoose ORM).
*   **Authentication:** JWT (JSON Web Tokens) with custom middleware (`auth`, `admin`, `owner` checks).
*   **File Storage:** Cloudinary or Local Handling (depending on env).

---

## 3. Design System & UI Guide

### Color Palette (Theme: "Future Academy")
*   **Primary:** Deep Violet / Indigo (`#6366f1`) - Used for active states, primary buttons.
*   **Accent:** Cyan / Sky Blue (`#0ea5e9`) - Used for secondary actions, info cards.
*   **Success:** Emerald Green (`#10b981`) - Success states, completed items.
*   **Warning:** Amber / Gold (`#f59e0b`) - Badges, warnings.
*   **Destructive:** Rose Red (`#f43f5e`) - Delete actions, errors.
*   **Backgrounds:**
    *   **Gradient:** `bg-gradient-to-br from-indigo-50 via-white to-cyan-50` (Light Mode).
    *   **Cards:** `bg-white/80 backdrop-blur-md border-white/20` (Glass effect).

### UX Patterns
*   **Micro-interactions:** Buttons should scale (`scale-105`) on hover. Cards should lift (`-translate-y-1`) on hover.
*   **Loaders:** Custom `Loader2` spin for all async actions.
*   **Empty States:** Never show a blank screen. Always show a specialized "No Data" component with an illustration and a Call-to-Action (CTA).

---

## 4. Role-Based Access Control (RBAC) Hierarchy

1.  **Owner (Level 100):** Super-Admin. Can create colleges, manage other admins. See ALL data across ALL colleges.
2.  **College Admin (Level 10):** Manages a specific college instance. Approves clubs, views college stats.
3.  **Club Coordinator (Level 8):** The "President" of a club.
    *   Can create Events, Challenges, Tasks.
    *   Can manage Members and Core Team.
4.  **Core Member (Level 4):** Club officers.
    *   Access to internal Club Chat.
    *   Can approve/reject generic join requests.
5.  **Club Member (Level 2):** Official member of a specific club.
6.  **Student (Level 1):** Verified user. Can join clubs, registered for events, view public data.

---

## 5. Detailed Feature Specifications

### A. Authentication & Onboarding
*   **Login/Register:** Email & Password auth.
*   **Onboarding Flow:**
    *   Users select their **College** from a dropdown.
    *   Users enter academic details (Branch, Year).
    *   **Avatar:** URL-based or auto-generated initials.
*   **Security:** Passwords hashed via Bcrypt. Change Password requires "Old Password" verification.

### B. User Profile & Gamification
*   **The "Dossier":** The profile page is treated as a professional record.
*   **Leveling System:**
    *   **XP Formula:** `Total XP` dictates `Level`.
    *   **Visual:** Progress bar showing "XP to next level".
*   **Badges:**
    *   **System Badges:** Automatic (e.g., "Early Adopter").
    *   **Club Badges:** Awarded by Coordinators (e.g., "Hackathon Winner").
    *   **Rendering:** Badges have unique icons (Gold/Silver/Bronze effects) and show the issuing club.
*   **Stats:** Cards for "Projects Completed," "Clubs Joined," "Challenges Won."
*   **Settings:** Edit profile, change password, logout.

### C. Clubs Module
*   **Discovery:** Grid view of clubs with search/filter.
*   **Club Detail Page:**
    *   **Header:** Banner, Member Count (Dynamic), Social Links.
    *   **Membership:** "Request to Join" button. If accepted, user sees "Leave Club".
    *   **Tabs:**
        *   **About:** Description, Core Team list.
        *   **Events:** Active & Past events list.
        *   **Challenges:** Active hackathons.
        *   **Members:** Public member list (with search).
*   **Club Chat:** Real-time chat accessible ONLY to accepted members.

### D. Owner & Admin Panels
*   **Owner Dashboard:**
    *   **User Management:** Table view of all users. Filter by Role/College.
        *   **Actions:** Edit Role, Ban/Block (Website, Clubs, or Challenges access).
    *   **College Admin View:** Impersonate or view data specific to one college.
*   **Approvals:**
    *   **Join Requests:** Coordinators Accept/Reject students.
    *   **Challenge Suggestions:** Members can suggest ideas; Coordinators approve them to make them live.

### E. Challenges & Hackathons Manager
*   **CRUD:** Coordinators create Challenges.
    *   **Phases:** Optional multi-stage setup (Phase 1, Phase 2).
    *   **Points:** Assign XP reward.
*   **Submission Workflow:**
    *   Student submits a Link.
    *   Status: `Pending` -> `Graded`.
*   **Grading System:**
    *   Coordinator views submission.
    *   Assigns **Marks (0-100)**.
    *   Writes **Feedback**.
    *   **Bonus:** Can award a specific "Skill" or "Badge" instantly upon grading.

### F. Project Marketplace
*   **Concept:** "LinkedIn + Jira" for students.
*   **Discovery:** List of open projects looking for teammates.
*   **Workspace (The "Cockpit"):**
    *   **Goals/Missions:** Tasks with deadlines and assignees.
    *   **Progress:** % calculated based on completed goals.
    *   **Team Chat:** Private chat for project members.
    *   **Resources:** Shared links section.
*   **Join Requests:** Owners approve/reject applicants based on "Skills" & "Pitch".

### G. Events Manager
*   **Event Lifecycle:** `Upcoming` -> `Active` -> `Completed`.
*   **Registration:**
    *   **Individual** or **Team** registration.
    *   **Payment:** QR Code upload support for paid events.
*   **Completion:**
    *   "End Event" button.
    *   **Poll Generation:** Auto-creates a feedback poll.
    *   **History:** Moves event to history and awards XP to confirmed attendees.

### H. Smart Campus
*   **Notes:**
    *   Repository for PDFs/Links.
    *   Filters: Branch, Year, Subject.
    *   Upload: Students contribute; Admins moderate.
*   **Campus Map:**
    *   List of locations (Labs, Library, Canteens).
    *   **Live Status:** Students mark locations as "Busy" "Free" or "Full".

### I. Task Management (Internal)
*   For **Club Core Teams** only.
*   **Daily Tasks:** Coordinators assign work to members.
*   **Verification:** Members mark "Done," Coordinators "Review & Approve".
*   **Reward:** Points assigned automatically on approval.

---

## 6. Database Schema (Key Models)

**User Model**
```json
{
  "name": "String",
  "email": "String (Unique)",
  "role": "Enum (student...owner)",
  "college": "String",
  "points": "Number",
  "xp": "Number",
  "badges": [{ "name": "String", "icon": "String", "issuer": "ClubID" }],
  "skills": ["String"]
}
```

**Club Model**
```json
{
  "name": "String",
  "coordinator": "UserID",
  "members": ["UserID"],
  "coreTeam": [{ "userId": "ID", "role": "String", "customTitle": "String" }]
}
```

**Challenge Model**
```json
{
  "title": "String",
  "clubId": "ObjectId",
  "phases": [{ "name": "String", "deadline": "Date" }],
  "submissions": [{ "userId": "ID", "link": "String", "marks": "Number" }]
}
```

---

## 7. Future Roadmap (Post-v2)
1.  **Resume Generator:** Auto-build PDFs from User Profiles.
2.  **Notification System:** Push notifications for App version.
3.  **Global Leaderboard:** Inter-college rankings.

---
*Generated by Antigravity Agent*
