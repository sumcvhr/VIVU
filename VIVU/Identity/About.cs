using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.Identity
{
    [Table("About")]
    public class About
    {
        [Key]
        public int AboutId { get; set; }
        public string AboutText { get; set; }
        [ForeignKey("User")]
        public int Id { get; set; }
    }
}
