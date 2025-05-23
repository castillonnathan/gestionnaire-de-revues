import { Component } from '@angular/core';
import { RevueComponent } from "./revue/revue.component";
import { Router, RouterLink, RouterLinkWithHref, RouterModule, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RevueComponent, RouterOutlet]
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