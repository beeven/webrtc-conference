import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { ConferenceHubService, Conference, RemoteUser } from 'src/app/conference/conferencehub.service';
import { switchMap, tap, mergeMap, map, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/providers/auth.service';
import { Subject, from, Observable, of } from 'rxjs';



class VideoDeviceInfo implements MediaDeviceInfo {
  constructor(
    public kind: MediaDeviceKind, public label: string,
    public deviceId: string, public groupId: string
  ) {
  }
  toJSON() {
    return {
      kind: this.kind,
      label: this.label,
      deviceId: this.deviceId,
      groupId: this.groupId
    };
  }
}



export interface ParticipantSession {
  userId: string;
  userName: string;
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
}


@Component({
  selector: 'app-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.scss']
})
export class ConferenceComponent implements OnInit, OnDestroy {

  conference: Conference;

  constraints: MediaStreamConstraints = { video: true };
  mediaDevices: MediaDeviceInfo[] = [];

  participants: ParticipantSession[] = [];

  localStream: MediaStream;

  rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.ideasip.com' }]
  };

  destroy$ = new Subject();

  @ViewChild('localVideo', { static: true }) localVideo: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private conferenceHubService: ConferenceHubService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // this.route.paramMap.pipe(
    //   switchMap((params: ParamMap) => {})
    // );
    const conferenceId = +this.route.snapshot.paramMap.get('id');

    this.getMediaDevices()
      .pipe(
        switchMap(() => this.authService.getUser()),
        tap((user) => console.log(user)),
        switchMap((user) => this.conferenceHubService.joinConference(user.name, conferenceId)),
      ).subscribe(
        () => {
          this.conferenceHubService.newUserJoined$.pipe(
            takeUntil(this.destroy$)
          ).subscribe(
            (user) => {
              this.participants.push({
                userId: user.userId,
                userName: user.userName,
                peerConnection: this.createPeerConnection(user.userId)
              });
              this.createOffer(user.userId);
            }
          );

          this.conferenceHubService.offerReceived$
            .pipe(
              takeUntil(this.destroy$),
            ).subscribe(
              offer => {
                if (offer.offerType === 'offer') {
                  console.log('Offer received.');
                  let participant = this.participants.find(x => x.userId === offer.userId);
                  if (!participant) {
                    participant = {
                      userId: offer.userId,
                      userName: offer.userName,
                      peerConnection: this.createPeerConnection(offer.userId)
                    };
                    this.participants.push(participant);
                  }
                  participant.userName = offer.userName;

                  participant.peerConnection.setRemoteDescription({
                    type: offer.offerType, sdp: offer.offerDescription
                  });
                  this.createAnswer(offer.userId);
                } else if (offer.offerType === 'answer') {
                  console.log('Answer received.');
                  const participant = this.participants.find(x => x.userId === offer.userId);
                  participant.peerConnection.setRemoteDescription({
                    type: offer.offerType, sdp: offer.offerDescription
                  });
                }
              }
            );

          this.conferenceHubService.iceCandidateReceived$
            .pipe(takeUntil(this.destroy$))
            .subscribe((candidate) => {
              let participant = this.participants.find(x => x.userId === candidate.userId);
              if (!participant) {
                participant = {
                  userId: candidate.userId,
                  userName: '',
                  peerConnection: this.createPeerConnection(candidate.userId)
                };
                this.participants.push(participant);
              }
              participant.peerConnection.addIceCandidate(
                JSON.parse(candidate.iceCandidateJson));
            });

          this.conferenceHubService.userDisconnected$
            .pipe(takeUntil(this.destroy$))
            .subscribe((user) => {
              const index = this.participants.findIndex(p => p.userId === user.userId);
              if (index >= 0) {
                this.participants[index].peerConnection.close();
                this.participants[index].stream = null;
                this.participants.splice(index, 1);
              }
            });
        }
      );
  }
  ngOnDestroy() {
    console.log('On component destroy');

    this.destroy$.next();
    this.destroy$.complete();

    this.conferenceHubService.disconnect();

    this.participants.forEach((p) => {
      p.peerConnection.close();
    });
  }

  createPeerConnection(destUserId: string) {
    const peerConnection = new RTCPeerConnection(this.rtcConfig);
    const userId = destUserId;
    peerConnection.onicecandidate = (ev) => {
      if (ev.candidate != null) {
        this.conferenceHubService.sendCandidateToUser(userId, JSON.stringify(ev.candidate));
      }
    };

    peerConnection.onicecandidateerror = (ev) => {
      console.error(`IceCandidateError: ${ev.errorText}`);
    };

    peerConnection.ontrack = (ev) => {
      const participant = this.participants.find(x => x.userId === destUserId);
      if (ev.streams && ev.streams[0]) {
        participant.stream = ev.streams[0];
      } else {
        if (!participant.stream) {
          participant.stream = new MediaStream();
        }
        participant.stream.addTrack(ev.track);
      }
      console.log(`peer ontrack`);
    };

    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream);
    });

    return peerConnection;
  }

  createOffer(destUserId: string) {
    const participant = this.participants.find(x => x.userId === destUserId);
    from(participant.peerConnection.createOffer({
      offerToReceiveVideo: true, offerToReceiveAudio: true
    }))
      .pipe(
        tap((offer) => {
          participant.peerConnection.setLocalDescription({
            sdp: offer.sdp, type: offer.type
          });
        }),
        tap((offer) => {
          this.conferenceHubService.sendOfferToUser(destUserId, offer.sdp, offer.type);
        })
      )
      .subscribe();
  }

  createAnswer(destUserId: string) {
    const participant = this.participants.find(x => x.userId === destUserId);
    from(participant.peerConnection.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true }))
      .pipe(
        tap(offer => {
          participant.peerConnection.setLocalDescription({ type: offer.type, sdp: offer.sdp });
        }),
        tap((offer) => {
          this.conferenceHubService.sendOfferToUser(destUserId, offer.sdp, offer.type);
        })
      )
      .subscribe();
  }

  getMediaDevices(): Observable<any> {
    return from(navigator.mediaDevices.enumerateDevices())
      .pipe(
        mergeMap(devices => {
          this.mediaDevices.push(...devices.filter(d => d.kind === 'videoinput'));
          if (this.mediaDevices.length > 0) {
            return navigator.mediaDevices.getUserMedia({ audio: true, video: { deviceId: this.mediaDevices[0].deviceId } });
          } else {
            return of(new MediaStream());
          }
        }),
        tap(stream => {
          this.localStream = stream;
          this.localVideo.nativeElement.srcObject = this.localStream;
        })
      );
  }

}
