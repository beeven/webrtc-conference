import { Component, OnInit } from '@angular/core';
import { AuthService, User } from './providers/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'conference';

  user: User;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.getUser().subscribe(
      (user) => { this.user = user; }
    );
  }

  updateUserName() {
    this.authService.updateUser(this.user.name);
  }

}
