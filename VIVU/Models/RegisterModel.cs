using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
namespace VIVU.Models
{
    public class RegisterModel 
    {
        [Required]
        public string FistName { get; set; }
        [Required]
        public string LastName { get; set; }
        [Required]
        public string Title { get; set; }
        [Required]
        public string NickName { get; set; }
        [Required]
        [DataType(DataType.EmailAddress)]
        public string Email { get; set; }
        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; }
        [Required]
        [DataType(DataType.Password)]
        [Compare("Password")]
        public string RePassword { get; set; }
        [Required]
        public string AvatarAdress { get; set; }

        public string About { get; set; }

    }
}
