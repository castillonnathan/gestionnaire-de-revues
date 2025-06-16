import { Component } from '@angular/core';
import { RevueComponent } from "./revue/revue.component";
import { Router, RouterLink, RouterLinkWithHref, RouterModule, RouterOutlet} from '@angular/router';
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [RouterOutlet, HeaderComponent, FooterComponent]
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