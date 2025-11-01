# AC Handymand - Timeregistrering System

Intern webapplikation til generering af timeregistreringsformularer for AC Handymand.dk ApS.

## Funktioner

- 🔐 Sikker login med Firebase Authentication
- 📄 PDF-generering af timeregistreringsformularer
- 👥 Medarbejderstyring
- 📅 Automatisk dato- og ugedagsgenerering (20. til 19.)
- 🎨 Responsivt design inspireret af virksomhedens hjemmeside

## Teknologi Stack

- **Frontend**: React 18 med Vite
- **Backend**: Firebase/Firestore
- **PDF-generering**: jsPDF
- **Routing**: React Router v6
- **Styling**: Custom CSS

## Projekt Struktur

```
achandymand-app/
├── src/
│   ├── components/          # Genanvendelige komponenter
│   │   ├── Layout.jsx       # Hovedlayout med sidebar
│   │   ├── EmployeeModal.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/               # Side komponenter
│   │   ├── Login.jsx
│   │   ├── Timeregistrering.jsx
│   │   └── Indstillinger.jsx
│   ├── services/            # Eksterne services
│   │   └── firebase.js      # Firebase konfiguration
│   ├── utils/               # Hjælpefunktioner
│   │   ├── dateUtils.js     # Dato håndtering
│   │   └── pdfGenerator.js  # PDF generering
│   ├── hooks/               # Custom React hooks
│   │   └── useAuthState.js
│   ├── App.jsx              # Hovedapp komponent
│   ├── App.css              # Global styling
│   └── main.jsx             # Entry point
├── public/                  # Statiske filer
├── index.html
├── vite.config.js
└── package.json
```

## Installation

### 1. Installer dependencies

```bash
cd achandymand-app
npm install
```

### 2. Firebase Konfiguration

1. Gå til [Firebase Console](https://console.firebase.google.com/)
2. Vælg projektet "achandymand-9b1b7"
3. Gå til Project Settings > General
4. Under "Your apps", find din web app config
5. Kopier konfigurationen og opdater `src/services/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "DIN_API_KEY",
  authDomain: "achandymand-9b1b7.firebaseapp.com",
  projectId: "achandymand-9b1b7",
  storageBucket: "achandymand-9b1b7.appspot.com",
  messagingSenderId: "DIT_MESSAGING_SENDER_ID",
  appId: "DIN_APP_ID"
};
```

### 3. Firestore Database Setup

1. Gå til Firestore Database i Firebase Console
2. Opret en collection kaldet `employees`
3. Sæt sikkerhedsregler (eksempel):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employees/{employeeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Firebase Authentication Setup

1. Gå til Authentication i Firebase Console
2. Aktivér Email/Password sign-in metode
3. Opret en bruger til administratoren

### 5. Start udviklingsserver

```bash
npm run dev
```

Appen kører nu på `http://localhost:5173`

## Build til Production

```bash
npm run build
```

Dette opretter en `dist/` mappe med de optimerede produktionsfiler.

## Deployment

### Hosting med Firebase

1. Installer Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login til Firebase:
```bash
firebase login
```

3. Initialiser Firebase hosting:
```bash
firebase init hosting
```

4. Vælg `dist` som public directory
5. Konfigurer som single-page app (SPA): Yes
6. Deploy:
```bash
npm run build
firebase deploy
```

## Brug af Applikationen

### Login
- Brug den e-mail og adgangskode, der er oprettet i Firebase Authentication

### Timeregistrering
1. Vælg år
2. Vælg månedpar (f.eks. "Oktober / November")
3. Vælg enten en specifik medarbejder eller "Alle ansatte"
4. Klik "Generér og download dokument"
5. PDF'en downloades automatisk

### Indstillinger
1. Tilføj medarbejdere med "Tilføj medarbejder" knappen
2. Redigér eller slet eksisterende medarbejdere efter behov

## Logo Integration

For at tilføje virksomhedens logoer:

1. Placer `logo_white.png` i `public/` mappen (til sidebar)
2. Placer `logo_black.png` i `public/` mappen (til PDF)
3. Opdater `src/components/Layout.jsx` for at bruge logo_white.png
4. Opdater `src/utils/pdfGenerator.js` for at inkludere logo_black.png i PDF

## Fejlfinding

### Firebase forbindelsesproblemer
- Kontroller at Firebase config er korrekt indsat
- Verificer at projektet "achandymand-9b1b7" eksisterer
- Tjek netværksforbindelse

### PDF generering fejler
- Kontroller at jsPDF er korrekt installeret
- Verificer at data er korrekt formateret

### Medarbejdere vises ikke
- Tjek Firestore sikkerhedsregler
- Verificer at brugeren er logget ind
- Kontroller browser console for fejl

## Support

For spørgsmål eller problemer, kontakt systemadministratoren.

## Licens

Privat - AC Handymand.dk ApS
