using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.ViewComponents
{
    public class LoginModal :ViewComponent
    {
        public async Task<IViewComponentResult> InvokeAsync()
    {
        return View();
    }
}
}
