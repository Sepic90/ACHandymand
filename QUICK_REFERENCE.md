# Quick Reference Card 🚀

Hurtig reference til de mest brugte kommandoer og information.

## 📁 Projekt Location
```
achandymand-app/
```

## 🔥 Firebase Project
- **Project ID**: achandymand-145da
- **Console**: https://console.firebase.google.com/

## ⚡ Almindelige Kommandoer

### Start Development Server
```bash
cd achandymand-app
npm run dev
```
**URL**: http://localhost:5173/

### Stop Development Server
```
Ctrl + C
```

### Install Dependencies (første gang)
```bash
npm install
```

### Build for Production
```bash
npm run build
```

### Deploy til Firebase
```bash
firebase deploy
```

## 🗂️ Vigtige Filer

### Firebase Config
```
src/services/firebase.js
```
Her indsættes Firebase credentials

### PDF Generator
```
src/utils/pdfGenerator.js
```
PDF layout og indhold

### Styling
```
src/App.css
```
Alle styles

### Sikkerhedsregler
```
firestore.rules
```
Database adgangskontrol

## 🔐 Login Info

**Type**: Email/Password  
**Setup**: Firebase Console > Authentication  
**Hvor oprettes**: Firebase Console > Authentication > Users

## 📄 Firestore Collections

### employees
```javascript
{
  name: "Medarbejder Navn",
  createdAt: "ISO timestamp"
}
```

**Sikkerhedsregel**: Kun authenticated users

## 🎨 Logo Placering
```
public/logo_white.png  (sidebar)
public/logo_black.png  (PDF)
```

## 🛠️ Troubleshooting

### "Cannot find module"
```bash
npm install
```

### Firebase connection error
- Check `src/services/firebase.js`
- Verify Firebase config
- Check internet connection

### PDF ikke genererer
- Check browser console (F12)
- Verify medarbejdere exists
- Check jsPDF installation

### Login virker ikke
- Verify user exists i Firebase
- Check email/password
- Check Firebase Authentication er enabled

## 📊 Projekt Stats

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Backend**: Firebase/Firestore
- **PDF Library**: jsPDF
- **Language**: Danish (UI)
- **Auth**: Firebase Auth

## 🌐 URLs

### Development
```
http://localhost:5173/
```

### Production (efter deploy)
```
https://achandymand-145da.web.app/
```

## 📱 Sider i App

1. **/login** - Login side
2. **/timeregistrering** - PDF generator
3. **/indstillinger** - Medarbejder management

## 🔄 Typisk Arbejdsflow

1. Start dev server: `npm run dev`
2. Åbn browser: `http://localhost:5173/`
3. Login med Firebase bruger
4. Arbejd med app
5. Stop server: `Ctrl + C`

## 📦 Dependencies

### Production
- react
- react-dom
- react-router-dom
- firebase
- jspdf

### Development
- vite
- @vitejs/plugin-react

## 🎯 Nøglefunktioner

✅ Sikker login  
✅ Medarbejderstyring  
✅ PDF generering  
✅ Multi-employee support  
✅ Dansk interface  
✅ Responsive design  

## 📞 Få Hjælp

1. **Dokumentation**:
   - README.md (teknisk)
   - SETUP_GUIDE.md (step-by-step)
   - PROJECT_OVERVIEW.md (oversigt)

2. **Console Check**:
   - Browser: F12 > Console
   - Terminal: check for error messages

3. **Firebase Console**:
   - https://console.firebase.google.com/project/achandymand-145da

## 💡 Tips

- Gem ofte under udvikling
- Test ændringer lokalt før deploy
- Check Firebase Console for fejl
- Brug git til version control