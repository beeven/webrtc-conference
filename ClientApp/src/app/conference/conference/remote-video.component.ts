import { Component, Input, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';

@Component({
    selector: 'app-remote-video',
    template: `<span class="userName">{{name}}</span><video class="remote-video" #remoteVideo autoplay></video>`,
    styles: [`
        :host {
            position: relative;
        }
        .remote-video {
            max-height: 200px;
        }
        .userName {
            position: absolute;
            left: 10px;
            top: 5px;
        }
    `]
})
export class RemoteVideoComponent {
    private mystream: MediaStream;
    @Input()
    set stream(s: MediaStream) {
        this.mystream = s;
        if (this.videoElem) {
            this.videoElem.nativeElement.srcObject = this.stream;
        }

    }
    get stream(): MediaStream {
        return this.mystream;
    }

    @Input() name: string;

    @ViewChild('remoteVideo', { static: false }) videoElem: ElementRef;
    constructor() { }

}
