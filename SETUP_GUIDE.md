# Hurtig Opsætningsguide til AC Handymand Timeregistrering

Denne guide forklarer trin-for-trin, hvordan du får applikationen til at køre.

## Hvad du har brug for

- En computer med internetadgang
- Node.js installeret (version 18 eller nyere)
- En Firebase konto (gratis)
- En teksteditor (f.eks. Visual Studio Code)

## Trin 1: Installer Node.js

1. Gå til https://nodejs.org/
2. Download "LTS" versionen (anbefalet)
3. Kør installationen og følg instruktionerne
4. Åbn en terminal/kommandoprompt og tjek installationen:
   ```
   node --version
   ```

## Trin 2: Download Projektet

1. Download projektmappen `achandymand-app`
2. Placer den et sted, hvor du nemt kan finde den (f.eks. Dokumenter)

## Trin 3: Opsæt Firebase

### 3.1 Opret Firebase Projekt (hvis ikke allerede gjort)

1. Gå til https://console.firebase.google.com/
2. Klik "Add project" eller vælg projektet "achandymand-9b1b7"
3. Følg instruktionerne

### 3.2 Aktivér Authentication

1. I Firebase Console, klik på "Authentication" i venstre menu
2. Klik "Get started"
3. Under "Sign-in method", aktivér "Email/Password"
4. Klik "Users" fanen
5. Klik "Add user" og opret en admin bruger:
   - Email: din@email.dk
   - Password: (vælg et sikkert password)

### 3.3 Opret Firestore Database

1. I Firebase Console, klik på "Firestore Database"
2. Klik "Create database"
3. Vælg "Start in production mode"
4. Vælg en placering (europe-west)
5. Klik "Enable"

### 3.4 Konfigurér Sikkerhedsregler

1. I Firestore Database, klik på "Rules" fanen
2. Erstat indholdet med:

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

3. Klik "Publish"

### 3.5 Hent Firebase Konfiguration

1. I Firebase Console, klik på gear-ikonet ⚙️ > Project settings
2. Scroll ned til "Your apps" sektionen
3. Klik på "</>" (Web app) ikonet
4. Giv appen et navn (f.eks. "AC Handymand Web")
5. Klik "Register app"
6. Kopier al koden under "const firebaseConfig"

### 3.6 Indsæt Firebase Konfiguration i Projektet

1. Åbn projektet i din teksteditor
2. Find filen: `src/services/firebase.js`
3. Erstat linjerne under `const firebaseConfig` med din kopierede konfiguration
4. Det skulle se sådan ud:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",  // Din egen API key
  authDomain: "achandymand-9b1b7.firebaseapp.com",
  projectId: "achandymand-9b1b7",
  storageBucket: "achandymand-9b1b7.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Gem filen

## Trin 4: Installér Projektet

1. Åbn en terminal/kommandoprompt
2. Naviger til projektmappen:
   ```
   cd sti/til/achandymand-app
   ```
3. Installér dependencies (dette tager et par minutter):
   ```
   npm install
   ```

## Trin 5: Start Applikationen

1. I terminalen, skriv:
   ```
   npm run dev
   ```
2. Du skulle se noget som:
   ```
   VITE v5.0.8  ready in XXX ms
   
   ➜  Local:   http://localhost:5173/
   ```
3. Åbn din browser og gå til `http://localhost:5173/`

## Trin 6: Log ind første gang

1. Brug den email og password, du oprettede i Firebase Authentication
2. Du skulle nu se hovedsiden

## Trin 7: Tilføj Medarbejdere

1. Klik på "Indstillinger" i venstre menu
2. Klik "Tilføj medarbejder"
3. Indtast medarbejderens navn
4. Klik "Gem"
5. Gentag for alle medarbejdere

## Trin 8: Generér Din Første PDF

1. Klik på "Timeregistrering" i venstre menu
2. Vælg år (f.eks. 2025)
3. Vælg månedpar (f.eks. "Oktober / November")
4. Vælg en medarbejder ELLER klik "Alle ansatte"
5. Klik "Generér og download dokument"
6. PDF'en downloades automatisk

## Ofte Stillede Spørgsmål

**Q: Jeg kan ikke logge ind?**
A: Tjek at du bruger den korrekte email og password fra Firebase Authentication.

**Q: Jeg ser ingen medarbejdere i dropdown?**
A: Gå til "Indstillinger" og tilføj først nogle medarbejdere.

**Q: PDF'en genereres ikke?**
A: Tjek browser konsollen for fejl (tryk F12 > Console fanen).

**Q: Hvordan stopper jeg applikationen?**
A: I terminalen, tryk `Ctrl + C`

**Q: Hvordan får jeg logoer med i PDF'en?**
A: Placer `logo_black.png` i `public/` mappen og opdater koden i `src/utils/pdfGenerator.js` (se README.md for detaljer).

## Får du Brug for Hjælp?

Hvis du støder på problemer:
1. Tjek at alle trin er fulgt korrekt
2. Tjek browser konsollen for fejlmeddelelser (F12)
3. Tjek Firebase Console for eventuelle advarsler
4. Kontakt en udvikler for assistance

## Deployment til Internet

Når du er klar til at gøre applikationen tilgængelig online:

1. Kør build kommando:
   ```
   npm run build
   ```
2. Installer Firebase CLI:
   ```
   npm install -g firebase-tools
   ```
3. Login til Firebase:
   ```
   firebase login
   ```
4. Initialiser hosting:
   ```
   firebase init hosting
   ```
   - Vælg dit projekt
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Overwrite index.html: `No`
5. Deploy:
   ```
   firebase deploy
   ```
6. Din app er nu tilgængelig på: `https://achandymand-9b1b7.web.app`

**Vigtigt**: Husk at opdatere Firebase sikkerhedsregler, hvis nødvendigt, for produktion.
