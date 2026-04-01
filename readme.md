<div align="center">

# 🏥 MediVault - Digital Healthcare Management System

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**MediVault** is a comprehensive **mobile healthcare application** designed to streamline patient-doctor interactions and medical record management. Built with **React Native + Expo** for cross-platform compatibility and a robust **Node.js/Express + MongoDB** backend for secure data handling.

[Overview](#-overview) • [Features](#-app-features) • [Current Stack](#-current-stack) • [Setup](#-setup-instructions) • [Architecture](#-architecture) • [API Routes](#-api-routes) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📋 Overview

MediVault is an innovative healthcare platform that bridges the gap between patients and healthcare providers by offering:

- **Centralized Medical Records**: Store and manage all medical records, reports, and documents securely in one place
- **Real-time Communication**: Instant messaging between patients and doctors for quick consultations
- **Medicine Management**: Track medication schedules, dosages, and maintain detailed medicine logs
- **Health Monitoring**: Log symptoms, track health metrics, and receive timely notifications
- **QR-based Profiles**: Generate and scan QR codes for quick patient profile access
- **Role-based Access**: Secure authentication with different access levels for patients and doctors

---

## 🚀 Current Stack

### Mobile App (Frontend)
- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript for type safety
- **State Management**: Context API (BadgeContext, ThemeContext)
- **UI Components**: Custom components (AppLayout, DrawerLayout, Navbar, Sidebar)
- **Styling**: Theme-based system with colors and constants
- **Responsive Design**: Supports both Android and iOS platforms

### Server (Backend)
- **Runtime**: Node.js
- **Framework**: Express.js (RESTful API)
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary integration for image/document uploads
- **Middleware**: Custom authentication, rate limiting, validation, file upload
- **Real-time Notifications**: Notification system with controller integration
- **Data Validation**: Request validation middleware for data integrity

### Key Dependencies
- **Backend**: express, mongoose, jsonwebtoken, multer, cloudinary, dotenv, nodemon
- **Frontend**: react-native, expo, expo-router, typescript
- **Testing**: jest, supertest (for API testing)

---

## 📱 App Features

### 👤 User Authentication & Profiles
- **Dual-role Support**: Separate authentication flows for patients and doctors
- **Secure Login**: JWT-based authentication with token refresh capability
- **Profile Management**: Users can update personal information, contact details, and specializations
- **QR Profile Generation**: Generate unique QR codes for quick profile sharing

### 🏥 Patient Features
- **Personal Dashboard**: Overview of health status, upcoming appointments, and recent activities
- **Medical Records**: Upload, store, and organize medical reports and documents
- **Medicine Tracker**: Keep track of current medications with dosages and schedules
- **Symptom Logging**: Log daily symptoms and health observations
- **Doctor Communication**: Direct messaging with assigned healthcare providers
- **Notifications**: Real-time alerts for appointments, medicine reminders, and updates

### 👨‍⚕️ Doctor Features
- **Doctor Dashboard**: Overview of patient load and pending tasks
- **Patient Management**: View list of assigned patients with detailed profiles
- **Patient Records Access**: Review medical history, reports, and symptoms
- **Message Management**: Communicate with patients through secure messaging
- **Health Monitoring**: View patient symptoms and health trends
- **Notifications**: Alerts for new patient messages and urgent cases

### 📊 Clinical Features
- **Medical Records System**: Full-featured document and report management
- **Dose Logging**: Track medication adherence and responses
- **QR-based Access**: Quick patient lookup through QR scanning
- **Real-time Messaging**: Secure doctor-patient communication
- **Symptom Tracking**: Comprehensive symptom logging with timestamps
- **Notification System**: Multi-channel notifications for critical updates

---

## 📂 Project Structure

```
MediVault/
├── backend/                          # Express API Server
│   ├── config/                       # Configuration files
│   │   ├── db.js                    # Database connection setup
│   │   ├── cloudinary.js            # Cloudinary file upload config
│   │   └── validateEnv.js           # Environment variables validation
│   ├── controllers/                 # Business logic handlers
│   │   ├── authController.js        # Login, register, token refresh
│   │   ├── dashboardController.js   # Dashboard data aggregation
│   │   ├── medicineController.js    # Medicine CRUD operations
│   │   ├── messageController.js     # Messaging system
│   │   ├── notificationController.js# Notification management
│   │   ├── qrController.js          # QR code generation/scanning
│   │   ├── recordController.js      # Medical records management
│   │   └── [other controllers]
│   ├── middleware/                  # Express middleware
│   │   ├── authValidation.js        # Auth-related validation
│   │   ├── requireRole.js           # Role-based access control
│   │   ├── verifyToken.js           # JWT token verification
│   │   ├── uploadReport.js          # File upload middleware
│   │   ├── rateLimiters.js          # API rate limiting
│   │   └── requestValidation.js     # Request data validation
│   ├── models/                      # Mongoose database schemas
│   │   ├── User.js                  # User/Doctor/Patient model
│   │   ├── Medicine.js              # Medicine schema
│   │   ├── MedRecord.js             # Medical records schema
│   │   ├── Report.js                # Report/document schema
│   │   ├── Message.js               # Messaging schema
│   │   ├── Conversation.js          # Conversation threads
│   │   ├── DoseLog.js               # Medicine dosage tracking
│   │   ├── SymptomLog.js            # Symptom logging
│   │   ├── Notification.js          # Notification schema
│   │   └── QrScanLog.js             # QR scan history
│   ├── routes/                      # API endpoint definitions
│   │   ├── auth.js                  # /api/v1/auth/*
│   │   ├── patient.js               # /api/v1/patient/*
│   │   ├── doctor.js                # /api/v1/doctor/*
│   │   ├── medicine.js              # /api/v1/medicine/*
│   │   ├── message.js               # /api/v1/message/*
│   │   └── [other routes]
│   ├── tests/                       # Test files (jest + supertest)
│   ├── postman/                     # Postman collection for API testing
│   ├── server.js                    # Express app entry point
│   ├── package.json                 # Backend dependencies
│   └── .env                         # Environment variables (not in repo)
│
├── frontend/                         # React Native Expo App
│   ├── app/                         # App router and layouts
│   │   ├── _layout.tsx              # Root layout
│   │   ├── index.tsx                # Home/splash screen
│   │   └── screens/                 # Application screens
│   │       ├── LoginScreen.tsx
│   │       ├── PatientDashboard.tsx
│   │       ├── DoctorDashboard.tsx
│   │       ├── Medicines.tsx
│   │       ├── Messages.tsx
│   │       ├── Notifications.tsx
│   │       ├── Profile.tsx
│   │       └── [other screens]
│   ├── components/                  # Reusable UI components
│   │   ├── AppLayout.tsx            # Main app layout wrapper
│   │   ├── DrawerLayout.tsx         # Drawer navigation
│   │   ├── Navbar.tsx               # Top navigation bar
│   │   ├── Sidebar.tsx              # Side menu
│   │   ├── ScreenHeader.tsx         # Screen headers
│   │   ├── UI.tsx                   # Common UI elements
│   │   └── [other components]
│   ├── services/                    # API service and utilities
│   │   └── api.ts                   # Axios/fetch API client
│   ├── context/                     # React Context for state
│   │   ├── BadgeContext.tsx         # Notification badge context
│   │   └── ThemeContext.tsx         # Theme/dark mode context
│   ├── constants/                   # App-wide constants
│   │   ├── colors.ts                # Color definitions
│   │   └── theme.ts                 # Theme configuration
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-color-scheme.ts      # Color scheme hook
│   │   └── use-theme-color.ts       # Theme color hook
│   ├── data/                        # Mock data for development
│   │   └── mockData.ts
│   ├── android/                     # Android native code
│   ├── app.json                     # Expo app configuration
│   ├── package.json                 # Frontend dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   └── eslint.config.js             # ESLint configuration
│
├── README.md                        # This file
├── backend_implementation.md        # Backend setup documentation
├── frontend_implementation.md       # Frontend setup documentation
└── package.json                     # Root package configuration
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** (v14+) and npm installed
- **MongoDB** (local or atlas connection string)
- **Cloudinary Account** (for file uploads) - [Sign up free](https://cloudinary.com/)
- **Expo CLI** (`npm install -g expo-cli`)
- Android Studio or Xcode (for emulator) or Expo Go app (for physical device)

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd MediVault
```

### 2️⃣ Backend Setup

#### Install dependencies:
```bash
cd backend
npm install
```

#### Create `.env` file in `backend/` directory with the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/medivault
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/medivault

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password_or_app_specific_password

# CORS Settings
FRONTEND_URL=http://localhost:3000
```

#### Start the backend server:

```bash
npm run dev
```

Backend will run on:
- **URL**: `http://localhost:5000`
- **API Base**: `http://localhost:5000/api/v1`

You should see: `✓ Server running on port 5000`

### 3️⃣ Frontend Setup

Open a new terminal in the `frontend` directory:

```bash
cd frontend
npm install
```

#### Start the Expo development server:

```bash
npx expo start
```

You'll see a terminal UI with options:

```
› Press a │ to open Android Emulator
› Press i │ to open iOS Simulator
› Press w │ to open web browser
› Press r │ to reload
› Press q │ to quit
```

#### Running on different platforms:

**Android Emulator:**
- Press `a` in the terminal
- Or manually: `npx expo start --android`

**iOS Simulator** (Mac only):
- Press `i` in the terminal
- Or manually: `npx expo start --ios`

**Physical Device:**
- Install Expo Go app (iOS App Store / Google Play)
- Scan QR code shown in terminal
- Ensure device is on same network as dev machine

**Web Browser** (development only):
- Press `w` in the terminal
- Or manually: `npx expo start --web`

### 4️⃣ Connecting Frontend to Backend

The frontend needs to know where your backend API is located. This depends on where you're running it:

#### In `frontend/services/api.ts` (or similar):

```typescript
// For Android Emulator (uses special IP)
const API_BASE_URL = 'http://10.0.2.2:5000/api/v1';

// For iOS Simulator
const API_BASE_URL = 'http://localhost:5000/api/v1';

// For Physical Device (replace with your machine's local IP)
const API_BASE_URL = 'http://192.168.1.100:5000/api/v1';

// For Web/Browser
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

**To find your local machine IP:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep inet
```

### 5️⃣ Configure MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Connection string in .env:
MONGO_URI=mongodb://localhost:27017/medivault
```

**Option B: MongoDB Atlas (Cloud)**
1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account and cluster
3. Get connection string
4. Add to `.env`:
```env
MONGO_URI=mongodb+srv://your_username:your_password@cluster-name.mongodb.net/medivault
```

### 6️⃣ Configure Cloudinary (for file uploads)

1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Go to Dashboard
3. Copy your **Cloud Name**, **API Key**, and **API Secret**
4. Add to `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────┐
│   Mobile App (React Native)     │
│   ├── Expo Router Navigation    │
│   ├── Context API for State     │
│   └── TypeScript Components     │
└──────────────┬──────────────────┘
               │ HTTPS/REST
               ↓
┌──────────────────────────────────┐
│   Express.js Backend API         │
│   ├── Route Handlers             │
│   ├── Middleware (Auth, Validate)│
│   ├── Controllers (BusinessLogic)│
│   └── Models (Mongoose Schemas)  │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
    ┌────────────┐  ┌─────────────────┐
    │  MongoDB   │  │  Cloudinary     │
    │  Database  │  │  File Storage   │
    └────────────┘  └─────────────────┘
```

### Authentication Flow

1. **User Login**: POST `/api/v1/auth/login` with credentials
2. **Token Generation**: Server creates JWT token
3. **Token Storage**: Frontend stores token in secure storage
4. **Request Authorization**: Each request includes token in Authorization header
5. **Token Validation**: Middleware verifies token on every protected route
6. **Token Refresh**: Expired tokens can be refreshed via refresh endpoint
7. **Logout**: Token is invalidated server-side

### Data Flow

1. **Frontend** → Sends API request with user data/filters
2. **Express Router** → Routes to appropriate controller
3. **Middleware** → Validates auth, input data, permissions
4. **Controller** → Implements business logic
5. **Model** → Interacts with MongoDB database
6. **Response** → Returns data/status to frontend
7. **Frontend** → Updates UI with received data

---

## � API Routes

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints (`/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user (patient/doctor) | ❌ |
| POST | `/auth/login` | User login with credentials | ❌ |
| POST | `/auth/verify-token` | Verify JWT token validity | ✅ |
| POST | `/auth/refresh-token` | Refresh expired token | ✅ |
| POST | `/auth/logout` | Logout user | ✅ |

#### Patient Registration Required Fields

For `role: "patient"`, the register payload must include caregiver details:

```json
{
   "firstName": "Jane",
   "lastName": "Doe",
   "email": "jane@example.com",
   "password": "Pass@123",
   "role": "patient",
   "caregiverName": "Ravi Doe",
   "caregiverEmail": "ravi@example.com",
   "caregiverPhone": "+15555551212"
}
```

These fields map each patient to an individual caregiver contact for missed-dose summary emails.

#### Optional SMTP Configuration (Caregiver Daily Summary Emails)

Set all of the following to enable caregiver email delivery:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
MAIL_FROM=
```

If SMTP variables are not configured, the backend continues to run and caregiver email delivery is skipped.

### Patient Endpoints (`/patient`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/patient/dashboard` | Get patient dashboard data | ✅ |
| GET | `/patient/profile` | Get patient profile | ✅ |
| PUT | `/patient/profile` | Update patient profile | ✅ |
| GET | `/patient/records` | Get all medical records | ✅ |
| POST | `/patient/records` | Upload medical record | ✅ |
| GET | `/patient/symptoms` | Get symptom logs | ✅ |
| POST | `/patient/symptoms` | Log new symptom | ✅ |
| GET | `/patient/medicines` | Get medicines list | ✅ |
| GET | `/patient/dose-logs` | Get dose tracking history | ✅ |

### Doctor Endpoints (`/doctor`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/doctor/dashboard` | Get doctor dashboard | ✅ |
| GET | `/doctor/patients` | Get list of patients | ✅ |
| GET | `/doctor/patients/:id` | Get specific patient details | ✅ |
| GET | `/doctor/patients/:id/records` | Get patient medical records | ✅ |
| POST | `/doctor/reports` | Upload/create patient report | ✅ |

### Medicine Endpoints (`/medicine`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/medicine` | Get all medicines | ✅ |
| POST | `/medicine` | Add new medicine | ✅ |
| GET | `/medicine/:id` | Get medicine details | ✅ |
| PUT | `/medicine/:id` | Update medicine | ✅ |
| DELETE | `/medicine/:id` | Delete medicine | ✅ |
| POST | `/medicine/:id/dose-log` | Log medicine dose | ✅ |

### Messaging Endpoints (`/message`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/message/conversations` | Get all conversations | ✅ |
| POST | `/message/conversations` | Start new conversation | ✅ |
| GET | `/message/conversations/:id` | Get conversation messages | ✅ |
| POST | `/message/send` | Send message | ✅ |
| PUT | `/message/:id` | Edit message | ✅ |
| DELETE | `/message/:id` | Delete message | ✅ |

### QR Endpoints (`/qr`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/qr/generate` | Generate QR for user | ✅ |
| POST | `/qr/scan` | Process scanned QR data | ✅ |
| GET | `/qr/profile/:qrId` | Get profile from QR | ❌ |

### Notification Endpoints (`/notification`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notification` | Get all notifications | ✅ |
| POST | `/notification` | Create notification | ✅ |
| PUT | `/notification/:id` | Mark as read | ✅ |
| DELETE | `/notification/:id` | Delete notification | ✅ |

### Testing API with Postman

A Postman collection is included in `backend/postman/`:
- **MediVault-Backend.postman_collection.json** - All API endpoints
- **MediVault-Local.postman_environment.json** - Local environment variables

1. Import collection into Postman
2. Select environment
3. Test endpoints with pre-configured requests

---

## � Database Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (patient | doctor),
  phone: String,
  dateOfBirth: Date,
  gender: String,
  profilePicture: String,
  specialization: String (for doctors),
  licenseNumber: String (for doctors),
  clinic: String (for doctors),
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Medicine Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  prescribedBy: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Medical Record Model
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: User),
  title: String,
  description: String,
  fileUrl: String,
  fileType: String,
  uploadDate: Date,
  diagnosis: String,
  notes: String
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId (ref: Conversation),
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  content: String,
  attachments: [String],
  isRead: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Configuration**: Controlled cross-origin requests
- **Rate Limiting**: API request throttling to prevent abuse
- **Input Validation**: Request validation middleware
- **File Upload Security**: Cloudinary-hosted uploads with validation
- **Role-Based Access Control**: Middleware for authorization
- **Environment Variables**: Sensitive data never hardcoded

---

## 🧪 Testing

### Backend Testing

Run tests with:
```bash
cd backend
npm test
```

Test files are in `backend/tests/`:
- `auth.routes.test.js` - Authentication endpoints
- `dashboard.controller.test.js` - Dashboard logic
- `notification.controller.test.js` - Notification system
- `message.routes.test.js` - Messaging endpoints

### Frontend Testing

(Testing setup in progress)

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **Backend won't start (Port already in use)**
```bash
# Find process on port 5000 (Windows)
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

#### **MongoDB connection error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Ensure MongoDB service is running
- Check connection string in `.env`
- For Windows: `net start MongoDB` or check Services
- For Mac: `brew services start mongodb-community`
- For Atlas: Verify IP whitelist allows your IP

#### **Cloudinary upload fails**
```
Error: Missing cloudinary credentials
```
**Solution:**
- Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`
- Check Cloudinary dashboard for correct credentials
- Ensure .env file exists and is readable

#### **Frontend can't reach backend**
```
Error: Network request failed
```
**Solution:**
- Verify backend is running: `http://localhost:5000` in browser
- Check API base URL in frontend matches backend IP
- For Android emulator: Use `10.0.2.2:5000` not `localhost`
- Ensure frontend and backend on same network (for physical devices)
- Check firewall allows port 5000

#### **Expo app crashes on startup**
```
Error: Cannot find module 'react-native'
```
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

#### **JWT token expired errors**
**Solution:**
- Implement token refresh logic
- Check JWT_EXPIRE in `.env`
- Ensure frontend handles 401 responses properly

#### **CORS errors in requests**
```
Access-Control-Allow-Origin error
```
**Solution:**
- Check CORS configuration in backend `server.js`
- Verify FRONTEND_URL in `.env`
- Check request headers include proper Content-Type

---

## 📚 Additional Documentation

- [Backend Implementation Guide](./backend_implementation.md) - Detailed backend setup
- [Frontend Implementation Guide](./frontend_implementation.md) - Detailed frontend setup
- [Postman Collection](./backend/postman/MediVault-Backend.postman_collection.json) - API testing

---

## 🚀 Performance Tips

- **API Caching**: Implement caching for frequently accessed data
- **Pagination**: Use pagination for large datasets
- **Lazy Loading**: Load data as needed in frontend
- **Image Optimization**: Compress images before uploading to Cloudinary
- **Database Indexing**: Add indexes to frequently queried fields
- **Bundle Size**: Monitor and optimize frontend bundle size

---

## 🔄 Development Workflow

### For Developers:

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Keep commits atomic and descriptive

3. **Test Locally**
   ```bash
   # Backend
   cd backend
   npm test
   npm run dev

   # Frontend
   cd frontend
   npx expo start
   ```

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: descriptive message"
   git push origin feature/feature-name
   ```

5. **Create Pull Request**
   - Ensure tests pass
   - Request review from team
   - Merge after approval

---

## 📋 Checklist for New Developers

- [ ] Clone repository
- [ ] Install Node.js and npm
- [ ] Configure MongoDB connection
- [ ] Get Cloudinary API credentials
- [ ] Create `backend/.env` file
- [ ] Run `npm install` in both folders
- [ ] Start backend: `npm run dev`
- [ ] Start frontend: `npx expo start`
- [ ] Test login functionality
- [ ] Access Postman collection for API testing

---

## 👨‍💻 Status & Future

**Current Status**: Active Development

**Completed Features**:
- ✅ User authentication (patient/doctor)
- ✅ Dashboard systems for both roles
- ✅ Medical records management
- ✅ Medicine tracking
- ✅ Messaging system
- ✅ QR profile generation
- ✅ Notification system

**In Progress**:
- 🔄 Advanced symptom analysis
- 🔄 Health trends visualization
- 🔄 Push notifications

**Planned Features**:
- 📋 Video consultation support
- 📋 Prescription management
- 📋 Lab reports integration
- 📋 Appointment scheduling
- 📋 Insurance claim support
- 📋 Multi-language support

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🤝 Support & Contact

For issues, questions, or suggestions:
- Create an issue on the repository
- Contact the development team
- Check existing documentation

---

## 🙏 Acknowledgments

- React Native & Expo community
- Express.js & Node.js ecosystem
- MongoDB documentation
- All contributors and testers

---

**Last Updated**: March 2026  
**Version**: 1.0.0
