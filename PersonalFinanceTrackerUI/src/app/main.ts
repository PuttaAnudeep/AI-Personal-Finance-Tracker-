import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { App } from './app.component';
import { routes } from './app.routes';
import { appConfig } from './app.config';

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
  ],
}).catch((err) => console.error(err));