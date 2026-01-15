# Calendly Clone - Fullstack Assignment

## 🚀 Live Demo
* **Frontend:** https://calendly-clone-bice.vercel.app/
* **Backend:** https://calendly-clone-edou.onrender.com

## 🛠 Tech Stack
* **Frontend:** React.js, Axios, React-Calendar
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Hosted on Neon)
* **Deployment:** Render (Backend)

## ✨ Core Features
* **Public Booking Page:** A clean interface for scheduling.
* **Event Types:** Supports 15, 30, and 60-minute durations.
* **Availability Logic:** Enforces Monday–Friday, 9:00 AM – 5:00 PM.
* **Conflict Prevention:** Server-side logic to prevent double-booking.
* **Meetings Dashboard:** Administrative view to track and manage appointments.
* **Admin Guard:** Password protection (`admin123`) for cancellations.

## 🗄️ Database Design
The schema uses a relational structure with `bookings` linked to `event_types` via foreign keys to ensure data integrity.

## ⚙️ Setup Instructions
1. Clone the repository.
2. **Backend Setup:** Navigate to `/backend`, run `npm install`, then `node server.js`.
3. **Frontend Setup:** Navigate to `/frontened`, run `npm install`, then `npm start`.

## 📝 Assumptions Made
* **Admin Access:** Assumed a default user is logged in for administrative tasks.
* **Data Seeding:** Database is pre-seeded with initial event types and test bookings.