import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { setLogLevel, LogLevel } from "@angular/fire";
setLogLevel(LogLevel.VERBOSE);


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideFirebaseApp(() => initializeApp({
      projectId: "dabubble-cd773",
      appId: "1:664512726615:web:9a234f4d135c2d86c14512",
      storageBucket: "dabubble-cd773.firebasestorage.app",
      apiKey: "AIzaSyB9wuP1tr9i6oUgJ7aQp4SNcqrxeFuIrWs",
      authDomain: "dabubble-cd773.firebaseapp.com",
      messagingSenderId: "664512726615"
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())]
};
