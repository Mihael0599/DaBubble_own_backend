import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IntroService {
  private hasShownIntro = false;

  hasIntroBeenShown(): boolean {
    return this.hasShownIntro;
  }

  markIntroAsShown(): void {
    this.hasShownIntro = true;
  }
}