using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.Identity
{
    public class User : IdentityUser
    {
        public string FistName { get; set; }
        public string LastName { get; set; }
        public string NickName { get; set; }
        public string Title { get; set; }
        public string About { get; set; }
        public int Degree { get; set; }
        public string AvatarAdress { get; set; }
        public string Password { get; internal set; }
    }
}
