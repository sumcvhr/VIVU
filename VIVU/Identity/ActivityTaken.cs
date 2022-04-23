using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.Identity
{
    [Table("ActivityTaken")]
    public class ActivityTaken
    {
        [Key]
        public int ActivityTakenId {get; set;}
        [ForeignKey("User")]
        public int Id { get; set; }
        [ForeignKey("Activity")]
        public int ActivityId { get; set; }
    }
}
