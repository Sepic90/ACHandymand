### 2. Firebase Konfiguration

1. Gå til [Firebase Console](https://console.firebase.google.com/)
2. Vælg projektet "achandymand-145da"
3. Gå til Project Settings > General
4. Under "Your apps", find din web app config
5. Kopier konfigurationen og opdater `src/services/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "DIN_API_KEY",
  authDomain: "achandymand-145da.firebaseapp.com",
  projectId: "achandymand-145da",
  storageBucket: "achandymand-145da.firebasestorage.app",
  messagingSenderId: "DIT_MESSAGING_SENDER_ID",
  appId: "DIN_APP_ID"
};
```