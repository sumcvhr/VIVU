using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.Identity
{
    [Table("Follow")]
    public class Follow
    {
        [Key]
        public int id { get; set; }
        [ForeignKey("User")]
        public string UserId { get; set; }
    }
}
