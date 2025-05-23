import { Component } from '@angular/core';
import { RevueComponent } from "./revue/revue.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RevueComponent]
})
export class AppComponent {
  title = 'gestionnaire-de-revues';

  countClicks() {
    let count = 0;
    return function() {
      count++;
      console.log('Button clicked ${count} times');
   };
  }
}