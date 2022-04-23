using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VIVU.Identity;

namespace VIVU.Models
{
    public class VivuListVm
    {
        public List<User> users { get; set; }
        public List<Activity> activities { get; set; }
        
    }
}
