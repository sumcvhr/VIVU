using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VIVU.Identity;
using VIVU.Models;
namespace VIVU.Controllers
{
    public class BaseController : Controller
    {
        public Identity.User UserOturumBlgi
        {
            get
            {

                string UseroturumBilgi = HttpContext.Session.GetString("oturum");
                if (UseroturumBilgi == null)
                {
                    return null;
                }
                var useroturum = JsonConvert.DeserializeObject<Identity.User>(UseroturumBilgi);
                return useroturum;
            }
        }
    }
}
