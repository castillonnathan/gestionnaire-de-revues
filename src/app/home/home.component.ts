import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterLinkWithHref],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
