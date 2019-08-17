import { Component, OnInit } from '@angular/core';
import { ConferenceHubService, Conference } from 'src/app/conference/conferencehub.service';

@Component({
    selector: 'app-conference-list',
    templateUrl: './conference-list.component.html',
    styleUrls: ['./conference-list.component.scss']
})
export class ConferenceListComponent implements OnInit {

    conferences: Conference[];

    constructor(private conferenceHubService: ConferenceHubService) { }

    ngOnInit() {
        this.conferenceHubService.getConferences().subscribe(
            (cs) => { this.conferences = cs; }
        );
    }
}
