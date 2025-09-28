import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { setLogLevel, LogLevel } from "@angular/fire";

import { environment } from '../environments/environment';

setLogLevel(LogLevel.VERBOSE);

// Phase A: Firebase für Login / Token-Exchange beibehalten.
// Phase B: Wenn du komplett ohne Firebase willst -> firebaseProviders = [] setzen.
const firebaseProviders = [
  provideFirebaseApp(() => initializeApp({
    projectId: "dabubble-cd773",
    appId: "1:664512726615:web:9a234f4d135c2d86c14512",
    storageBucket: "dabubble-cd773.firebasestorage.app",
    apiKey: "AIzaSyB9wuP1tr9i6oUgJ7aQp4SNcqrxeFuIrWs",
    authDomain: "dabubble-cd773.firebaseapp.com",
    messagingSenderId: "664512726615"
  })),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore())
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // <<< Wichtig: HttpClient + JWT-Interceptor
    provideHttpClient(withInterceptors([authInterceptor])),

    // Firebase wahlweise aktiv lassen (Phase A) oder entfernen (Phase B)
    ...firebaseProviders
  ]
};