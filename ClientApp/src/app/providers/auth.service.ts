import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export class User {
    name: string;
    id: number;
}

@Injectable()
export class AuthService {

    currentUserSubject = new BehaviorSubject<User>({name: 'beeven', id: 1});

    constructor() {

    }

    getUser(): Observable<User> {
        return this.currentUserSubject.asObservable();
    }

    updateUser(name: string ) {
        const id = Math.round(Math.random() * 100);
        this.currentUserSubject.next({name, id});
    }
}
