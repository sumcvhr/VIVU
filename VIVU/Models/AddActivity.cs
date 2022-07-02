using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.Models
{
    public class AddActivity
    {
        [Required]
        public string ActivityName { get; set; }
        [Required]
        public DateTime ActivityDate { get; set; }
        [Required]
        public DateTime ActivityTime { get; set; }
        [Required]
        public int ActivityPrice { get; set; }
        [Required]
        public string ActivityDetail { get; set; }
        [Required]
        public string BannerAdress { get; set; }
        [Required]
        public int Category { get; set; }
    }
}
