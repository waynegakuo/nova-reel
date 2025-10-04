import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { UserAuthComponent } from '../user-auth/user-auth.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [
    NgOptimizedImage,
    UserAuthComponent,
    RouterLink
  ],
  standalone: true
})
export class NavbarComponent {
}
