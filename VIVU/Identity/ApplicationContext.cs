using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.Identity
{
    public class ApplicationContext : IdentityDbContext<User>
    {
        public ApplicationContext(DbContextOptions<ApplicationContext> options):base(options) 
        {
        
        }

        public virtual DbSet<Activity> Activity { get; set; }
        public virtual DbSet<User> User { get; set; }
        public virtual DbSet<ActivityTaken> ActivityTaken { get; set; }
        public virtual DbSet<Follow> Follow { get; set; }
        public virtual DbSet<Followers> Followers { get; set; }
        public virtual DbSet<Category> Category { get; set; }
    }
}
