using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using WebRTCConference.Data;

namespace WebRTCConference.Hubs
{
    public class ConferenceHub: Hub
    {
        private readonly ConferenceContext conferenceContext;

        public ConferenceHub(ConferenceContext conferenceContext) 
        {
            this.conferenceContext = conferenceContext;
            this.conferenceContext.Database.EnsureCreated();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var participantId = Context.ConnectionId;
            var participant = await this.conferenceContext.Participants.SingleOrDefaultAsync(p => p.ParticipantId == participantId);
            if(participant != null) {
                await Clients.OthersInGroup(participant.ConferenceId.ToString()).SendAsync("UserDisconnected", participantId);
                this.conferenceContext.Participants.Remove(participant);
                await this.conferenceContext.SaveChangesAsync();
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public async Task<Conference[]> GetConferences()
        {
            return await this.conferenceContext.Conferences.AsNoTracking().ToArrayAsync();
        }

        public async Task<Conference> GetConference(int id)
        {
            return await this.conferenceContext.Conferences.AsNoTracking().SingleOrDefaultAsync(c => c.ConferenceId == id);
        }

        public async Task<Conference> CreateConference(string name)
        {
            var conference = new Conference(){ Name = name };
            await this.conferenceContext.Conferences.AddAsync(conference);
            await this.conferenceContext.SaveChangesAsync();
            return conference;
        }

        public async Task<string> JoinConference(string userName, int conferenceId)
        {
            var conference = await this.conferenceContext.Conferences.FindAsync(conferenceId);

            if(conference == null) {
                throw new Exception("Conference doest not exist.");
            }
            
            var participant = new Participant() {ParticipantId=Context.ConnectionId, Name = userName,  ConferenceId = conferenceId, Conference=conference };
            await this.conferenceContext.Participants.AddAsync(participant);
            await this.conferenceContext.SaveChangesAsync();

            await Groups.AddToGroupAsync(Context.ConnectionId, conferenceId.ToString());
            System.Console.WriteLine($"New user joined, name: {userName}, id: {Context.ConnectionId}");
            await Clients.OthersInGroup(conferenceId.ToString()).SendAsync("NewUserJoined",userName, Context.ConnectionId, conferenceId);
            return Context.ConnectionId;
        }

        public async Task LeftConference()
        {
            var participantId = Context.ConnectionId;
            var participant = await this.conferenceContext.Participants.SingleAsync(p => p.ParticipantId == participantId);
            await Clients.OthersInGroup(participant.ConferenceId.ToString()).SendAsync("UserDisconnected", participantId);
            this.conferenceContext.Participants.Remove(participant);
            await this.conferenceContext.SaveChangesAsync();
        }

        public async Task SendIceCandidateToUser(string destUserId, string iceCandidateJson)
        {
            await Clients.Client(destUserId).SendAsync("IceCandidateReceived", Context.ConnectionId, iceCandidateJson);
        }

        public async Task SendOfferToUser(string destUserId, string offerDescription, string offerType)
        {
            Console.WriteLine($"Sending offer from {Context.ConnectionId} to {destUserId}.");
            var sender = await this.conferenceContext.Participants.SingleAsync(x=>x.ParticipantId == Context.ConnectionId);
            await Clients.Client(destUserId).SendAsync("OfferReceived",Context.ConnectionId, sender.Name, offerDescription, offerType);
        }

    }
}