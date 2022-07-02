using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using VIVU.Models;

namespace VIVU.Identity
{
    [Table("Activity")]
    public class Activity 
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ActivtyId { get; set; }
        public string ActivityName { get; set; }
        public DateTime  ActivityDate { get; set; }
        public DateTime  ActivityTime { get; set; }
        public int  ActivityPrice { get; set; } 
        public string ActivityDetail { get; set; }
        [ForeignKey("User")]
        public string Id { get; set; }
        public int Cotegory { get; set; }
        public string BannerAdress { get; set; }
    }
}
