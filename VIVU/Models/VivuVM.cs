using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VIVU.Identity;

namespace VIVU.Models
{
    public class VivuVM
    {
        public RegisterModel register { get; set; }
        public User user { get; set; }
        public Activity activity { get; set; }
        public UserModel usermodel { get; set; }
        public LoginModel login { get; set; }
        public Category category { get; set; }
        public ActivityCategory acategory { get; set; }
        public List<Category>  categories { get; set; }
        public ResetPasswordModel reset { get; set; }
        public List<Activity> activities { get; set; }
        public PaymentViewModel pvm { get; set; }
        public CompletedViewModel cvm { get; set; }
        public InstallmentViewModel ivm { get; set; }
    }
}
