# File Structure & Descriptions

Komplet oversigt over alle filer i projektet og deres funktion.

## 📂 Root Directory

```
achandymand-app/
├── 📄 .gitignore              # Filer Git skal ignorere (node_modules, .env, etc.)
├── 📄 package.json            # Project dependencies og scripts
├── 📄 vite.config.js          # Vite build configuration
├── 📄 index.html              # HTML entry point
├── 📄 firebase.json           # Firebase hosting configuration
├── 📄 firestore.rules         # Database sikkerhedsregler
├── 📄 README.md               # Teknisk dokumentation (DU ER HER)
└── 📄 SETUP_GUIDE.md          # Step-by-step opsætningsguide
```

## 📂 src/ (Source Code)

Hovedmappen med al applikationskode.

### Main Files
```
src/
├── 📄 main.jsx                # React entry point - starter appen
├── 📄 App.jsx                 # Root component med routing setup
└── 📄 App.css                 # Global styling for hele appen
```

**main.jsx**: Renderer React app til DOM  
**App.jsx**: Definerer alle routes og authentication flow  
**App.css**: Alle styles - login, layout, forms, buttons, etc.

### 📂 components/ (Reusable Components)

```
src/components/
├── 📄 Layout.jsx              # Hovedlayout med sidebar navigation
├── 📄 EmployeeModal.jsx       # Modal til add/edit medarbejder
└── 📄 ProtectedRoute.jsx      # HOC til route authentication
```

**Layout.jsx**  
- Viser sidebar med logo og navigation  
- Håndterer log ud funktionalitet  
- Wrapper omkring alle beskyttede sider  

**EmployeeModal.jsx**  
- Popup form til medarbejder input  
- Bruges både til add og edit  
- Validerer input før save  

**ProtectedRoute.jsx**  
- Checker om bruger er logget ind  
- Redirecter til login hvis ikke  
- Viser loading state mens check  

### 📂 pages/ (Page Components)

```
src/pages/
├── 📄 Login.jsx               # Login side med email/password
├── 📄 Timeregistrering.jsx    # PDF generator interface
└── 📄 Indstillinger.jsx       # Settings - medarbejder management
```

**Login.jsx**  
- Email/password input form  
- Firebase authentication  
- Dansk fejlhåndtering  
- Redirect efter success  

**Timeregistrering.jsx**  
- Vælg år dropdown  
- Vælg månedpar dropdown  
- Vælg medarbejder(e)  
- Generér PDF knap  
- Loading state  

**Indstillinger.jsx**  
- Vis alle medarbejdere  
- Add/Edit/Delete funktionalitet  
- Firebase Firestore integration  
- Bekræftelse ved sletning  

### 📂 services/ (External Services)

```
src/services/
└── 📄 firebase.js             # Firebase initialization og config
```

**firebase.js**  
- Firebase app initialization  
- Auth og Firestore setup  
- Config objekt (skal udfyldes)  
- Exporterer auth og db instances  

### 📂 utils/ (Utility Functions)

```
src/utils/
├── 📄 dateUtils.js            # Dato og måned håndtering
└── 📄 pdfGenerator.js         # PDF creation logik
```

**dateUtils.js**  
- Danske ugedage og måneder  
- Date range generator (20-19)  
- Weekend detection  
- Format helpers  
- Month pair labels  

**pdfGenerator.js**  
- jsPDF implementation  
- Table layout og styling  
- Multi-page support  
- Company info rendering  
- Logo placering (placeholder)  

### 📂 hooks/ (Custom React Hooks)

```
src/hooks/
└── 📄 useAuthState.js         # Authentication state hook
```

**useAuthState.js**  
- Lytter til Firebase auth changes  
- Returnerer user og loading state  
- Bruges i ProtectedRoute  

### 📂 assets/ (Static Assets)

```
src/assets/
└── (placeholder for billeder, fonts, etc.)
```

Denne mappe er tom nu, men kan bruges til:  
- Ikoner  
- Billeder  
- Fonts  
- Andre statiske filer  

## 📂 public/ (Public Assets)

```
public/
└── (placer logoer her)
    ├── logo_white.png (til sidebar)
    └── logo_black.png (til PDF)
```

Filer her kopieres direkte til build output.  
Tilgængelige via root path (f.eks. `/logo_white.png`)

## 📄 Configuration Files Detail

### package.json
```json
{
  "dependencies": {
    "react": "^18.2.0",           // UI framework
    "react-dom": "^18.2.0",       // React DOM rendering
    "react-router-dom": "^6.20.0", // Routing
    "firebase": "^10.7.1",        // Backend services
    "jspdf": "^2.5.1"             // PDF generation
  },
  "devDependencies": {
    "vite": "^5.0.8",             // Build tool
    "@vitejs/plugin-react": "^4.2.1" // React plugin
  }
}
```

### vite.config.js
Minimal config - kun React plugin enabled.

### firebase.json
Hosting configuration:
- Public directory: `dist`
- SPA rewrites
- Cache headers for assets

### firestore.rules
Security rules:
- Employees collection: authenticated only
- All else: denied

### index.html
HTML template med:
- Danish language tag
- Viewport meta
- Root div
- Script import

## 🔄 Data Flow

```
User Input (UI)
    ↓
React Components
    ↓
Services/Utils
    ↓
Firebase/PDF Generation
    ↓
Response to User
```

### Authentication Flow
```
Login Page
    ↓
Firebase Auth
    ↓
useAuthState hook
    ↓
ProtectedRoute check
    ↓
Main App Layout
```

### PDF Generation Flow
```
Timeregistrering Page
    ↓
Load employees from Firestore
    ↓
User selects options
    ↓
Click "Generér"
    ↓
dateUtils generates dates
    ↓
pdfGenerator creates PDF
    ↓
Download to user
```

### Employee Management Flow
```
Indstillinger Page
    ↓
Load from Firestore
    ↓
Display in list
    ↓
User clicks Add/Edit/Delete
    ↓
Modal opens (if add/edit)
    ↓
Save to Firestore
    ↓
Reload list
```

## 📏 Code Statistics

- **Total Files**: 21
- **React Components**: 7
- **Utility Files**: 2
- **Config Files**: 5
- **Documentation Files**: 3
- **Lines of Code**: ~2000+

## 🎨 Styling Approach

**CSS Organization**:
- Global styles i App.css
- BEM-inspired class naming
- Component-specific sections
- Responsive breakpoints
- Color variables via CSS

**Design Language**:
- Mørkeblå gradient (sidebar, login)
- Grøn action buttons
- Hvid content areas
- Subtile shadows
- Smooth transitions

## 🔐 Security Considerations

**Implemented**:
- ✅ Firebase Authentication
- ✅ Protected routes
- ✅ Firestore security rules
- ✅ .gitignore for sensitive files

**User Responsibility**:
- 🔒 Keep Firebase credentials secure
- 🔒 Use strong admin passwords
- 🔒 Review production security rules
- 🔒 Never commit secrets to git

## 🚀 Build Output

After running `npm run build`:

```
dist/
├── index.html           # Optimized HTML
├── assets/
│   ├── index-[hash].js  # Bundled JavaScript
│   └── index-[hash].css # Bundled CSS
└── logo files (if added)
```

This is what gets deployed to Firebase Hosting.

## 📝 Naming Conventions

- **Components**: PascalCase (Login.jsx, Layout.jsx)
- **Utilities**: camelCase (dateUtils.js, pdfGenerator.js)
- **CSS Classes**: kebab-case (login-container, btn-primary)
- **Functions**: camelCase (generatePDF, handleSubmit)
- **Constants**: UPPER_SNAKE_CASE (WEEKDAYS_DA)

## 🔄 Update Workflow

Når du ændrer kode:

1. Modificér relevant fil
2. Save (hot reload i dev mode)
3. Test i browser
4. Commit ændringer til git
5. Build for production hvis klar
6. Deploy til Firebase

---

**This structure supports**:
✅ Easy maintenance  
✅ Clear separation of concerns  
✅ Scalability for future features  
✅ Beginner-friendly organization  
