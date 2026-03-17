# 🏥 MediVault (React Native App)

MediVault is now a **mobile-first healthcare app** built with **React Native + Expo** and powered by a **Node.js/Express + MongoDB** backend.

It helps patients and doctors manage records, medicines, reports, and communication in one place.

---

## 🚀 Current Stack

### Mobile App (Frontend)
- React Native
- Expo
- Expo Router
- TypeScript

### Server (Backend)
- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Multer + Cloudinary (report/file uploads)

---

## 📱 App Features

- Patient and doctor authentication
- Patient dashboard and profile
- Doctor dashboard and patient list/details
- Medical records and reports flow
- Medicine tracking and timeline/symptom screens
- QR profile support

> Note: Some modules may still be in active development.

---

## 📂 Project Structure

```
MediVault/
├── backend/        # Express API + MongoDB models/routes/controllers
├── frontend/       # React Native Expo app (mobile UI)
└── README.md
```

---

## ⚙️ Setup Instructions

### 1) Clone repository

```bash
git clone <your-repo-url>
cd MediVault
```

### 2) Start backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:
- `http://localhost:5000` (default)

Create `backend/.env` with your values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### 3) Start React Native app

Open a new terminal:

```bash
cd frontend
npm install
npx expo start
```

Then run on:
- Android emulator
- iOS simulator (Mac)
- Expo Go (physical device)

---

## 🔌 API Base URL Notes (Important)

When connecting the mobile app to backend:

- Android emulator: use `http://10.0.2.2:5000`
- iOS simulator: use `http://localhost:5000`
- Physical device: use `http://<your-local-ip>:5000`

Make sure backend and mobile device are on the same network when testing on a real phone.

---

## 📡 Main API Prefix

Current backend routes are mounted under:

- `/api/v1/auth`
- `/api/v1/patient`
- `/api/v1/doctor`
- `/api/v1/medicine`

---

## 👨‍💻 Status

MediVault has moved from a web-first concept to a **React Native mobile app architecture**.

This README reflects the current app direction.
