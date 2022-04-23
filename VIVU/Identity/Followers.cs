using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.Identity
{
    [Table("Followers")]
    public class Followers
    {
        [Key]
        public string id { get; set; }
        [ForeignKey("User")]
        public string UserId { get; set; }
    }
}
