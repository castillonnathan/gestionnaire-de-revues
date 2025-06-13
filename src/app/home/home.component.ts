import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkWithHref } from '@angular/router';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterLinkWithHref, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
