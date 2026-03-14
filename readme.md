<div align="center">

# 🏥 MediVault

### *One place for your entire health story.*

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white)

**A unified healthcare platform** that consolidates medical records, AI-powered report analysis, medication tracking, and doctor-to-patient SMS in one role-based web application.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-reference) • [Team](#-team)

</div>

---

## 📌 The Problem

Patients carry physical files between hospitals. Doctors miss critical history. Elderly users are excluded from digital health. Medication non-adherence causes **50% of treatment failures**. No single platform connects all of this.

## ✅ The Solution

MediVault unifies records, AI report analysis, symptom triage, medicine tracking, caregiver alerts, and doctor-to-patient SMS in one platform — accessible on any browser, on any device.

---

## ✨ Features

### Core MVP
| Feature | Description |
|---|---|
| 🔐 **Role-Based Auth** | JWT with `patient` / `doctor` roles. Separate register flows. bcrypt password hashing. |
| 📁 **Medical Records** | Create visit records with date, diagnosis, doctor name, notes, and prescribed medicines. |
| 📤 **File Upload** | Upload PDF lab reports, CT scans, MRI images via Multer → stored on Cloudinary. |
| 🤖 **AI Report Summariser** | GPT-4o vision reads uploaded files and returns a plain-English summary with abnormal value flags. |
| 👨‍⚕️ **Doctor Dashboard** | Search patient by email/ID. View full health timeline, AI summaries, prescriptions, adherence score. |
| 📱 **Doctor → Patient SMS** | Doctor clicks "Contact Patient" → Twilio delivers SMS to patient's phone instantly. |
| 🔖 **QR Emergency Profile** | Every patient gets a unique QR code. Scanning shows blood type, allergies, medications — no login needed. |
| 💊 **Medicine Tracker** | Add medicines with schedule. One-tap mark taken/missed. Adherence score calculated from DoseLog. |
| 🩺 **Symptom Checker** | Free-text symptom input → OpenAI returns 2–5 possible conditions + recommended specialist type. |

### Optional (if time allows)
- 📅 **Health Timeline** — all events on one chronological timeline per patient
- 📧 **Caregiver Email Alert** — Nodemailer email when 3+ consecutive doses are missed
- ⏰ **node-cron Reminders** — scheduled dose reminder emails 15 min before due time

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML / CSS / JS + EJS | Responsive UI, role-aware navigation, QR display |
| Backend | Node.js + Express | REST API, routing, middleware, cron jobs |
| Database | MongoDB + Mongoose | Users, records, medicines, dose logs, file metadata |
| Auth | JWT + bcrypt | Role-based token auth (patient / doctor) |
| File Storage | Multer + Cloudinary | Upload & serve PDFs, CT scans, MRI images |
| AI Engine | OpenAI GPT-4o | Report summarisation (vision), symptom analysis |
| SMS | Twilio | Doctor-to-patient SMS outreach |
| QR Code | qrcode (npm) | Patient emergency profile QR generation |
| Email (opt.) | Nodemailer + Gmail SMTP | Caregiver alerts, dose reminders |
| Scheduler (opt.) | node-cron | Background dose reminder jobs |
| Hosting | Render / Railway | Free-tier deployment for demo |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier)
- OpenAI API key
- Twilio trial account

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/medivault.git
cd medivault
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root directory:
```env
# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/medivault

# Auth
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Twilio
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+1xxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-your_openai_key

# Server
PORT=5000
```

**4. Run the development server**
```bash
npm run dev
# Server running on http://localhost:5000
```

**5. (Optional) Seed demo data**
```bash
npm run seed
# Seeds 3 patients, 2 doctors, 7 days of dose logs, 3 AI-summarised reports
```

---

## 📁 Project Structure

```
medivault/
├── config/
│   ├── db.js                  # MongoDB connection
│   └── cloudinary.js          # Cloudinary + Multer setup
├── controllers/
│   ├── authController.js
│   ├── recordController.js
│   ├── medicineController.js
│   ├── symptomController.js
│   ├── smsController.js
│   └── qrController.js
├── middleware/
│   ├── verifyToken.js          # JWT validation
│   └── requireRole.js          # Role-based access guard
├── models/
│   ├── User.js
│   ├── MedRecord.js
│   ├── Medicine.js
│   ├── DoseLog.js
│   └── SymptomLog.js
├── routes/
│   ├── auth.js
│   ├── patient.js
│   ├── doctor.js
│   ├── medicine.js
│   ├── symptom.js
│   └── qr.js
├── views/
│   ├── patient/                # dashboard, records, medicines, qr
│   ├── doctor/                 # dashboard, patient-view, sms
│   └── auth/                   # login, register
├── public/                     # CSS, client-side JS
├── uploads/                    # Temp files before Cloudinary
├── .env
└── server.js
```

---

## 🗄 Database Schemas

```js
User        { name, email, passwordHash, role: 'patient'|'doctor', phone,
              bloodType, allergies[], emergencyContact, assignedDoctorId,
              specialisation, hospital, createdAt }

MedRecord   { patientId, doctorId, date, diagnosis, notes,
              medicines[], fileUrls[], aiSummary, createdAt }

Medicine    { patientId, name, dosage, frequency, timeSlots[], startDate, endDate }

DoseLog     { medicineId, patientId, scheduledTime, status: 'taken'|'missed', loggedAt }

SymptomLog  { patientId, symptoms, aiConditions[], timestamp }
```

---

## 📡 API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register as patient or doctor |
| `POST` | `/api/auth/login` | Login, receive JWT |

### Patient Routes `[Patient]`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patient/dashboard` | Patient dashboard data |
| `GET` | `/api/patient/records` | All medical records |
| `POST` | `/api/patient/records` | Create new medical record |
| `POST` | `/api/patient/upload` | Upload file → Cloudinary → trigger AI summary |
| `GET` | `/api/patient/qr` | Generate / retrieve QR code |

### Medicine Routes `[Patient]`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/medicine` | Add medicine to tracker |
| `POST` | `/api/medicine/:id/log` | Mark dose taken or missed |
| `GET` | `/api/medicine/adherence` | Get adherence score per medicine |

### Doctor Routes `[Doctor only]`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/doctor/patient/:id` | View full patient profile |
| `POST` | `/api/doctor/sms` | Send SMS to patient via Twilio |

### Public
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/symptom/check` | Submit symptoms → AI analysis |
| `GET` | `/api/qr/:patientId` | Public QR emergency profile — no auth |

---

## 👥 User Personas

| Persona | Description |
|---|---|
| **Riya, 28** — Urban Patient | Tech-savvy professional. Visits multiple specialists. Wants everything in one shareable place. |
| **Ramesh, 68** — Elderly Patient | Manages diabetes & hypertension. Basic phone literacy. Needs his doctor to reach him via SMS without any app interaction. |
| **Dr. Priya, 42** — Busy Doctor | Sees 30+ patients/day. Needs instant access to full patient history, AI-summarised reports, and one-click patient follow-up. |
| **Meena, 45** — Caregiver | Managing her elderly mother's health. Wants the doctor notified automatically when a report is uploaded or medicines are missed. |

---

## ⏱ 30-Hour Sprint Timeline

| Hours | Phase | Focus |
|---|---|---|
| 0 – 2 | Kickoff & Setup | Repo, DB, API keys, schema contracts |
| 2 – 6 | Auth + Models | JWT, bcrypt, all Mongoose schemas |
| 4 – 10 | File Upload + AI | Multer → Cloudinary → OpenAI pipeline |
| 6 – 12 | Medicine Tracker | CRUD, DoseLog, adherence score |
| 8 – 16 | Frontend Sprint | All EJS views, CSS, responsive design |
| 10 – 14 | Twilio + QR | SMS endpoint, QR generation, public route |
| 16 – 22 | Integration | Wire frontend to API, error handling |
| 22 – 25 | Testing + Seed | QA both roles, seed realistic demo data |
| 25 – 27 | Deploy | Push to Render/Railway, smoke test |
| 27 – 28 | Should-Haves | Timeline / caregiver email if time allows |
| 28 – 30 | Demo Prep | README polish, demo script, backup video |

---

## 👨‍💻 Team

| Member | Role | Responsibilities |
|---|---|---|
| Member 1 | Backend Lead | Express server, MongoDB, Mongoose models, JWT auth, Cloudinary, Multer |
| Member 2 | AI + Integrations | OpenAI report summariser, symptom checker, Twilio SMS, QR generation, cron |
| Member 3 | Frontend | All EJS templates, CSS, responsive design, status badges, file upload UI |
| Member 4 | Full-Stack / QA | Medicine tracker, adherence score, Nodemailer, testing, seed data, deployment |

---

## ⚠️ Disclaimer

> MediVault's AI report summariser and symptom checker are **decision-support tools only**, not diagnostic systems.
>
> *"This information is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider."*
>
> All data used during the hackathon is mock/seed data only — **no real patient information**.

---

## 📄 License

This project was built for a 30-hour hackathon. © 2026 MediVault Team.

---

<div align="center">
Built with ❤️ using Node.js • Express • MongoDB • OpenAI • Cloudinary • Twilio
</div>
