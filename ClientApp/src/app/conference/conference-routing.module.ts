import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConferenceListComponent } from './conference-list/conference-list.component';
import { ConferenceComponent } from './conference/conference.component';


const routes: Routes = [
  {path: 'conferences', component: ConferenceListComponent},
  {path: 'conference/:id', component: ConferenceComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConferenceRoutingModule { }
