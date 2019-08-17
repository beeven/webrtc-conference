import { Injectable, OnDestroy } from '@angular/core';

import * as signalR from '@aspnet/signalr';
import { Observable, fromEvent, Subject, from, BehaviorSubject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';



export interface RemoteUser {
    userId: string;
    userName?: string;
}

export interface Conference {
    conferenceId: number;
    name: string;
    participantCount: number;
}

export interface UserIceCandidate {
    userId: string;
    iceCandidateJson: string;
}

export interface UserOffer {
    userId: string;
    userName?: string;
    offerDescription: string;
    offerType: RTCSdpType;
}


@Injectable()
export class ConferenceHubService implements OnDestroy {

    connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/conference')
        .build();

    newUserJoined$: Observable<RemoteUser>;
    iceCandidateReceived$: Observable<UserIceCandidate>;
    offerReceived$: Observable<UserOffer>;
    userDisconnected$: Observable<RemoteUser>;


    constructor() {
        console.log('On hub service create.');

        this.newUserJoined$ = fromEvent(this.connection, 'NewUserJoined',
            (userName: string, userId: string) => {
                return { userName, userId } as RemoteUser;
            }).pipe(
                tap((user) => {
                    console.log(`New user joined: ${user.userId} ${user.userName}`);
                })
            );

        this.iceCandidateReceived$ = fromEvent(this.connection, 'IceCandidateReceived',
            (userId: string, iceCandidateJson: string) => {
                return { userId, iceCandidateJson };
            }).pipe(
                tap((user) => {
                    console.log(`Ice candidate received from: ${user.userId}`);
                })
            );

        this.offerReceived$ = fromEvent(this.connection, 'OfferReceived',
            (userId: string, userName: string, offerDescription: string, offerType: RTCSdpType) => {
                return { userId, userName, offerDescription, offerType };
            }).pipe(
                tap((user) => {
                    console.log(`Offer received: ${user.userId} ${user.userName}`);
                })
            );

        this.userDisconnected$ = fromEvent(this.connection, 'UserDisconnected',
            (userId: string) => {
                return { userId };
            }).pipe(
                tap((user) => {
                    console.log(`User disconnected: ${user.userId}`);
                })
            );
    }

    ngOnDestroy() {
        console.log('On hub service desctroy.');
        if (this.connection.state === signalR.HubConnectionState.Connected) {
            this.connection.stop();
        }
    }

    private async ensureConnected(): Promise<void> {
        if (this.connection.state === signalR.HubConnectionState.Connected) {
            return;
        }
        return this.connection.start();
    }

    getConferences(): Observable<Conference[]> {
        return from(this.ensureConnected())
            .pipe(
                switchMap(() => this.connection.invoke<Conference[]>('GetConferences'))
            );
    }

    async joinConference(userName: string, conferenceId: number): Promise<any> {
        await this.ensureConnected();
        return this.connection.send('JoinConference', userName, conferenceId);
    }

    async sendOfferToUser(userId: string, offerDescription: string, offerType: RTCSdpType): Promise<void> {
        await this.ensureConnected();
        console.log(`sending offer to user: ${userId}`);
        return this.connection.send('SendOfferToUser', userId, offerDescription, offerType);
    }

    async sendCandidateToUser(userId: string, iceCandidateJson: string): Promise<void> {
        await this.ensureConnected();
        console.log('sending candidate to user');
        return this.connection.send('SendIceCandidateToUser', userId, iceCandidateJson);
    }

    async disconnect() {
        return this.connection.send('LeftConference');
    }
}
