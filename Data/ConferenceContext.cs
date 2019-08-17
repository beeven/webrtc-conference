using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace WebRTCConference.Data
{
    public class ConferenceContext:DbContext
    {
        public ConferenceContext() { }

        public ConferenceContext(DbContextOptions<ConferenceContext> options): base(options) { }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Conference>()
                .HasKey(c => c.ConferenceId);

            modelBuilder.Entity<Conference>()
                .Property(c => c.ConferenceId)
                .ValueGeneratedOnAdd();

            modelBuilder.Entity<Conference>()
                .HasData(
                    new Conference() { ConferenceId = 1,Name = "Testing Conference", ParticipantCount = 5 },
                    new Conference() { ConferenceId = 2,Name = "Meeting 2", ParticipantCount = 14 },
                    new Conference() { ConferenceId = 3,Name = "Morbi leo risus", ParticipantCount = 1 }
                );
            
            modelBuilder.Entity<Participant>()
                .HasKey(p => p.ParticipantId);
            
        }



        public DbSet<Conference> Conferences{get;set;}
        public DbSet<Participant> Participants{get;set;}

    }

    public class Conference
    {
        public int ConferenceId {get;set;}
        public string Name {get;set;}

        public int ParticipantCount {get;set;}

        public List<Participant> Participants;
    }

    public class Participant
    {
        public string ParticipantId {get;set;}
        public string Name {get;set;}

        public int ConferenceId {get;set;}
        public Conference Conference{get;set;}

    }
}