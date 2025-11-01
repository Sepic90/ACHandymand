# Implementation Checklist ✓

Brug denne tjekliste til at få applikationen op at køre.

## Før Du Starter

- [ ] Node.js er installeret (version 18+)
- [ ] Du har adgang til Firebase Console
- [ ] Du har en teksteditor (VS Code anbefales)
- [ ] Projektmappen er downloadet

## Firebase Opsætning

### Authentication
- [ ] Gået til Firebase Console
- [ ] Valgt/oprettet projekt "achandymand-9b1b7"
- [ ] Aktiveret "Email/Password" authentication
- [ ] Oprettet første admin bruger
- [ ] Noteret email og password

### Firestore Database
- [ ] Oprettet Firestore database
- [ ] Valgt location (europe-west)
- [ ] Deployed sikkerhedsregler fra `firestore.rules`

### Web App Config
- [ ] Tilføjet/valgt web app i Firebase
- [ ] Kopieret Firebase configuration
- [ ] Indsat i `src/services/firebase.js`
- [ ] Gemt filen

## Lokal Installation

- [ ] Navigeret til projektmappen i terminal
- [ ] Kørt `npm install`
- [ ] Ventet på installation (kan tage flere minutter)
- [ ] Ingen fejlmeddelelser

## Første Test

- [ ] Kørt `npm run dev`
- [ ] Åbnet `http://localhost:5173/` i browser
- [ ] Login siden vises korrekt
- [ ] Logget ind med Firebase bruger
- [ ] Navigation virker
- [ ] Ingen console errors (F12)

## Medarbejder Setup

- [ ] Klikket på "Indstillinger" i menu
- [ ] Tilføjet første medarbejder
- [ ] Navn gemt korrekt
- [ ] Tilføjet alle relevante medarbejdere
- [ ] Medarbejdere vises alfabetisk

## PDF Test

- [ ] Gået til "Timeregistrering"
- [ ] Valgt år (f.eks. 2025)
- [ ] Valgt månedpar
- [ ] Valgt en medarbejder
- [ ] Klikket "Generér og download dokument"
- [ ] PDF downloadet automatisk
- [ ] PDF åbner korrekt
- [ ] Datoer er korrekte (20. til 19.)
- [ ] Ugedage er korrekte
- [ ] Weekend i rød
- [ ] Virksomhedsinfo korrekt

## Logo Integration (Valgfrit)

- [ ] `logo_white.png` placeret i `public/` mappen
- [ ] `logo_black.png` placeret i `public/` mappen
- [ ] Opdateret `src/components/Layout.jsx`:
  ```jsx
  <img 
    src="/logo_white.png" 
    alt="AC Handymand Logo" 
    className="sidebar-logo"
  />
  ```
- [ ] Opdateret `src/utils/pdfGenerator.js` (se kommentarer i koden)
- [ ] Genstartet dev server
- [ ] Logoer vises korrekt

## Multi-Employee Test

- [ ] Checket "Alle ansatte"
- [ ] Genereret PDF
- [ ] PDF har en side per medarbejder
- [ ] Hver side har korrekt navn

## Production Deployment (Når klar)

- [ ] Kørt `npm run build`
- [ ] Build succeeded uden fejl
- [ ] Installeret Firebase CLI: `npm install -g firebase-tools`
- [ ] Kørt `firebase login`
- [ ] Kørt `firebase init hosting`
- [ ] Valgt korrekt projekt
- [ ] Valgt `dist` som public directory
- [ ] Konfigureret som SPA (Single Page App)
- [ ] Kørt `firebase deploy`
- [ ] Besøgt deployment URL
- [ ] Alt virker i production

## Security Checks (Production)

- [ ] Firestore sikkerhedsregler er deployed
- [ ] Kun authenticated users kan læse/skrive employees
- [ ] Test at unauthenticated access denied
- [ ] Admin bruger password er sikkert

## Documentation Check

- [ ] Læst README.md
- [ ] Læst SETUP_GUIDE.md
- [ ] Forstået projekt struktur
- [ ] Ved hvor man finder hjælp

## Final Verification

- [ ] Applikation starter uden fejl
- [ ] Login virker
- [ ] PDF generering virker
- [ ] Medarbejdere kan tilføjes/redigeres/slettes
- [ ] Navigation er intuitiv
- [ ] Design matcher virksomhedens stil
- [ ] Alle tekster er på dansk
- [ ] Performance er acceptabel

## Support Reference

**Hvis du sidder fast:**
1. Check denne liste igen
2. Læs SETUP_GUIDE.md for detaljer
3. Check browser console for fejl (F12)
4. Check Firebase Console for advarsler
5. Kontakt en udvikler

---

**Tips**: Gem denne tjekliste som reference. Marker punkter som færdige efterhånden.

**Status Trackin**:
- ⬜ Ikke startet
- 🔄 I gang
- ✅ Færdig
- ❌ Problem (notér detaljer)

Held og lykke! 🚀
