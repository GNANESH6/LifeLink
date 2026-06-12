# LifeLink

LifeLink is a full-stack, modern web application designed to connect blood donors with individuals in urgent need. Built using the MERN stack (MongoDB, Express, React, Node.js), LifeLink features a clean, responsive UI and robust backend services to ensure seamless matching through geospatial filtering and real-time emergency requests.

## Features

- **Geospatial Donor Search:** Find nearby blood donors using accurate distance calculations (Haversine formula).
- **Emergency Requests:** Broadcast and manage urgent blood requirements based on location and blood type.
- **Secure Authentication:** User registration and login utilizing robust JWT (JSON Web Tokens) and bcrypt password hashing, alongside Google Single Sign-On (SSO).
- **Profile Management:** Users can manage their personal details, blood group, donor type, and real-time availability status.
- **Graceful Data Fallback:** The backend dynamically switches to a local JSON file-based database if a MongoDB connection (`MONGO_URI`) is not provided, making it extremely easy to run and test locally.
- **Modern UI/UX:** Built with React, TailwindCSS, and Framer Motion for beautiful micro-animations and responsive layouts.

## Architecture

LifeLink employs a decoupled architecture:
- `frontend/`: The client-side application built with React, Vite, and TailwindCSS.
- `backend/`: The server-side API built with Node.js, Express, and Mongoose.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account (Optional, but recommended for production data persistence)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `backend/` directory based on the `.env.example` file.
   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_here
   MONGO_URI=your_mongodb_connection_string # Optional: If omitted, the app will use local JSON files.
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend API will run on `http://localhost:3000`.*

### 2. Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend Vite server proxies `/api` calls directly to the backend.*

---

## Tech Stack

**Frontend:**
- React (v19)
- Vite
- TailwindCSS (v4)
- Framer Motion (Animations)
- React Leaflet (Mapping capabilities)
- Lucide React (Icons)

**Backend:**
- Node.js
- Express
- Mongoose (MongoDB ODM)
- JWT (Authentication)
- bcryptjs (Security)

---

## Deployment
For production deployment, you can deploy the `backend` to services like Render or Railway, and the `frontend` to Vercel or Netlify. Make sure to set the respective environment variables and ensure the frontend API requests point to the deployed backend URL.
