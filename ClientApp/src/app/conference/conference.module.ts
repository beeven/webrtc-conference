import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConferenceRoutingModule } from './conference-routing.module';
import { ConferenceComponent } from './conference/conference.component';
import { ConferenceListComponent } from './conference-list/conference-list.component';
import { FormsModule } from '@angular/forms';
import { ConferenceHubService } from './conferencehub.service';
import { RemoteVideoComponent } from './conference/remote-video.component';


@NgModule({
  declarations: [ConferenceComponent, ConferenceListComponent, RemoteVideoComponent],
  imports: [
    CommonModule,
    FormsModule,
    ConferenceRoutingModule,
  ],
  providers: [ConferenceHubService]
})
export class ConferenceModule { }
