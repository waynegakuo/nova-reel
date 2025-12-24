import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {initializeApp, provideFirebaseApp, FirebaseApp} from '@angular/fire/app';
import {environment} from '../environments/environment.development';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {getAnalytics, provideAnalytics} from '@angular/fire/analytics';
import {getFunctions, provideFunctions} from '@angular/fire/functions';
import {PLATFORM_ID, inject} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideAnalytics(() => {
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        return getAnalytics();
      }
      return null as any;
    }),
    provideFunctions(() => getFunctions(inject(FirebaseApp), 'africa-south1')),
  ]
};
