import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'gestionnaire-de-revues';

  countClicks() {
    let count = 0;
    return function() {
      count++;
      console.log(`Button clicked ${count} times`);
    };
  }
}
