using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using VIVU.EmailServices;
using VIVU.Extensions;
using VIVU.Identity;
using VIVU.Models;
using VIVU.Controllers;
using System.Net;
using Microsoft.EntityFrameworkCore;

namespace VIVU.Controllers
{

    [AutoValidateAntiforgeryToken]
    public class HomeController : Controller
    {

        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly ApplicationContext _context;
        private readonly ILogger<HomeController> _logger;
        private IEmailSender _emailSender;
        public HomeController(IEmailSender emailSender, ILogger<HomeController> logger, ApplicationContext context, UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _logger = logger;
            _emailSender = emailSender;
        }
        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(VivuVM model, List<IFormFile> Avatar, int Id, object sender, EventArgs e)
        {
            if (model.login != null)
            {
                var LoginUser = new User()
                {
                    NickName = model.login.NickName,
                    Password = model.login.Password,
                    Email = model.login.Email,
                };
                var UserLogin = _context.User.FirstOrDefault(P => P.NickName == LoginUser.NickName && P.Password == LoginUser.Password);
                if (UserLogin != null)
                {
                    HttpContext.Session.SetString("oturum", JsonConvert.SerializeObject(UserLogin));
                    return RedirectToAction("Index", "Home");
                }

                else
                {
                    ViewBag.Message = "Geçersiz Kullanıcı Adı yada Parola";
                    return View();
                }
            }
            else if (model.register != null)
            {
                try
                {
                    if (model.register == null)
                    {
                        return View(model);
                    }
                    string filePath = "";
                    var user = new User()
                    {
                        FistName = model.register.FistName,
                        LastName = model.register.LastName,
                        NickName = model.register.NickName,
                        Password = model.register.Password,
                        Title = model.register.Title,
                        Email = model.register.Email,
                        AvatarAdress = filePath,
                    };
                    var userm = new UserModel
                    {
                        FistName = model.register.FistName,
                        LastName = model.register.LastName,
                        NickName = model.register.NickName,
                        Password = model.register.Password,
                        Title = model.register.Title,
                        Email = model.register.Email,
                        AvatarAdress = filePath,
                    };

                    var kayitvarmi = _context.User.FirstOrDefault(P => P.Email == user.Email && P.NickName == user.NickName);
                    if (kayitvarmi == null)
                    {


                        foreach (var dosya in Avatar)
                        {
                            if (dosya.Length > 0)
                            {
                                string CAvatar = "Avatar" +
                                    Guid.NewGuid().ToString().Substring(0, 4);
                                string Avatars = CAvatar + "Avatar" +
                                    dosya.FileName;
                                var ustklasor = Directory.GetParent(Directory.GetCurrentDirectory());
                                string dosyaAdiOnEk = user.Email.Replace('@', '_').Replace('.', '_').ToString();
                                string dosyaAdi = dosyaAdiOnEk + "_" + dosya.FileName;
                                string dosyaYolu = Path.Combine(ustklasor.FullName + "/VIVU", $"wwwroot/Avatar/{dosyaAdi}");
                                using (var stream = System.IO.File.Create(dosyaYolu))
                                {
                                    dosya.CopyTo(stream);
                                    user.AvatarAdress = "/Avatar/" + dosyaAdi;
                                    userm.AvatarAdress = "/Avatar/" + dosyaAdi;
                                }

                            }
                        }

                        if (model.register != null)
                        {
                            userm.FistName = user.FistName;
                            userm.LastName = user.LastName;
                            userm.NickName = user.NickName;
                            userm.Email = user.Email;
                            userm.Title = user.Title;
                        }
                        _context.User.Add(user);
                        _context.SaveChanges();
                    }


                    var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                    var url = Url.Action("ConfirmEmail", "Home", new
                    {
                        userId = user.Id,
                        token = code
                    });

                    // email
                    await _emailSender.SendEmailAsync(model.register.Email, "Hesabınızı onaylayınız.", $"Lütfen email hesabınızı onaylamak için linke <a href='https://localhost:5001{url}'>tıklayınız.</a>");

                }
                catch (Exception ex)
                {

                    ModelState.AddModelError("", "Bilinmeyen hata oldu lütfen tekrar deneyiniz.");

                }
            }
            return RedirectToAction("Login", "Home");

        }

        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            TempData.Put("message", new AllertMessage()
            {
                Title = "Oturum Kapatıldı.",
                Message = "Hesabınız güvenli bir şekilde kapatıldı.",
                AlertType = "warning"
            });
            return Redirect("~/");
        }
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            if (userId == null || token == null)
            {
                TempData.Put("message", new AllertMessage()
                {
                    Title = "Geçersiz token.",
                    Message = "Geçersiz Token",
                    AlertType = "danger"
                });
                return View();
            }
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                var result = await _userManager.ConfirmEmailAsync(user, token);
                if (result.Succeeded)
                {
                    TempData.Put("message", new AllertMessage()
                    {
                        Title = "Hesabınız onaylandı.",
                        Message = "Hesabınız onaylandı.",
                        AlertType = "success"
                    });
                    return View();
                }
            }
            TempData.Put("message", new AllertMessage()
            {
                Title = "Hesabınızı onaylanmadı.",
                Message = "Hesabınızı onaylanmadı.",
                AlertType = "warning"
            });
            return View();
        }
        public IActionResult Index(string Id, VivuVM veri)
        {
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            Id = veri.user.Id;
            veri.activities = _context.Activity.Where(P => P.Id == Id).ToList();
            return View("Index", veri);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        public IActionResult PaymentPage()
        {
            return View();
        }
        [HttpGet]
        public IActionResult ActivityForm()
        {
            return View();
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ActivityForm(VivuVM model, List<IFormFile> Banner)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            veri.categories = _context.Category.ToList();
            if (veri != null)
            {
                string filePath = "";

                var activity = new Identity.Activity()
                {
                    ActivityName = model.activity.ActivityName,
                    ActivityDate = model.activity.ActivityDate,
                    ActivityDetail = model.activity.ActivityDetail,
                    Category = model.activity.Category,
                    ActivityTime = model.activity.ActivityTime,
                    ActivityPrice = model.activity.ActivityPrice,

                    BannerAdress = filePath,
                };

                foreach (var dosya in Banner)
                {
                    if (dosya.Length > 0)
                    {
                        string CAvatar = "Banner" +
                            Guid.NewGuid().ToString().Substring(0, 4);
                        string Avatar = CAvatar + "Banner" +
                            dosya.FileName;
                        var ustklasor = Directory.GetParent(Directory.GetCurrentDirectory());
                        string dosyaAdiOnEk = activity.ActivtyId.ToString();
                        string dosyaAdi = dosyaAdiOnEk + "_" + dosya.FileName;
                        string dosyaYolu = Path.Combine(ustklasor.FullName + "/VIVU", $"wwwroot/Banner/{dosyaAdi}");
                        using (var stream = System.IO.File.Create(dosyaYolu))
                        {
                            dosya.CopyTo(stream);
                            activity.BannerAdress = "/Banner/" + dosyaAdi;
                        }

                    }



                }
                activity.Id = veri.user.Id;
                _context.Activity.Add(activity);
                _context.SaveChanges();
            }


            ModelState.AddModelError("", "Bilinmeyen hata oldu lütfen tekrar deneyiniz.");
            return RedirectToAction("ActivityForm", "Home");
        }
        [HttpPost]
        public IActionResult ActivityCategory(VivuVM model)
        {
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            veri.categories = _context.Category.ToList();
            if (veri != null)
            {
                _context.Category.Add(veri.category);
                _context.SaveChanges();
            }
            return RedirectToAction("ActivityForm");
        }
        public IActionResult ActivityCalendar(string Id, VivuListVm listveri, VivuVM veri)
        {
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            Id = veri.user.Id;
            veri.activities = _context.Activity.Where(P => P.Id == Id).ToList();
            return View("ActivityCalendar", veri);
        }
        [HttpGet]
        public IActionResult Settings()
        {
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            return View("Settings", veri);
        }
        [HttpPost]
        public IActionResult Settings(User user, List<IFormFile> Avatar, string eskiparola)
        {
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            //var GuncellenecekKayit = _context.User.FirstOrDefault(P => P.Id == UserOturumBlgi.Id);
            var GuncellenecekKayit = _context.User.FirstOrDefault(P => P.Id == veri.user.Id);
            string filePath = user.AvatarAdress;
            GuncellenecekKayit.FistName = user.FistName;
            GuncellenecekKayit.LastName = user.LastName;
            GuncellenecekKayit.Email = user.Email;
            GuncellenecekKayit.AvatarAdress = filePath;
            GuncellenecekKayit.NickName = user.NickName;
            GuncellenecekKayit.Title = user.Title;
            foreach (var dosya in Avatar)
            {
                if (dosya.Length > 0)
                {
                    string CAvatar = "Avatar" +
                        Guid.NewGuid().ToString().Substring(0, 4);
                    string Avatars = CAvatar + "Avatar" +
                        dosya.FileName;
                    var ustklasor = Directory.GetParent(Directory.GetCurrentDirectory());
                    string dosyaAdiOnEk = user.Email.Replace('@', '_').Replace('.', '_').ToString();
                    string dosyaAdi = dosyaAdiOnEk + "_" + dosya.FileName;
                    string dosyaYolu = Path.Combine(ustklasor.FullName + "/VIVU", $"wwwroot/Avatar/{dosyaAdi}");
                    using (var stream = System.IO.File.Create(dosyaYolu))
                    {
                        dosya.CopyTo(stream);
                        GuncellenecekKayit.AvatarAdress = "/Avatar/" + dosyaAdi;
                    }

                }
            }
            if (GuncellenecekKayit.Password == eskiparola)
            {
                GuncellenecekKayit.Password = user.Password;
            }

            _context.SaveChanges();
            HttpContext.Session.SetString("oturum", JsonConvert.SerializeObject(GuncellenecekKayit));
            return RedirectToAction("Settings");
        }
        public IActionResult MyProfilePage(int Id)
        {
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            //veri.user = _context.User.Include("User").Where(P => P.Id == OturumBilgi.Id);
            return View("MyProfilePage", veri);
        }
        [HttpPost]
        public IActionResult MyProfilePage(VivuVM model, User user)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            var About = _context.User.FirstOrDefault(P => P.Id == veri.user.Id);
            About.About = user.About;
            _context.SaveChanges();
            return RedirectToAction("MyProfilePage");
        }
        public IActionResult ProfilePage()
        {
            return View();
        }
        [HttpGet]
        public IActionResult LiveBroadcast()
        {
            return View();
        }
        [HttpPost]
        public async Task<IActionResult> SaveRecoredFile()
        {
            if (Request.Form.Files.Any())
            {
                var file = Request.Form.Files["video-blob"];
                string UploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "UploadedFiles");
                string UniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName + ".webm";
                string UploadPath = Path.Combine(UploadFolder, UniqueFileName);
                await file.CopyToAsync(new FileStream(UploadPath, FileMode.Create));
            }
            return Json(HttpStatusCode.OK);
        }
        public IActionResult ForgotPassword()
        {
            return View();
        }
        [HttpPost]
        public async Task<IActionResult> ForgotPassword(string Email)
        {
            if (string.IsNullOrEmpty(Email))
            {
                return View();
            }
            var user = await _userManager.FindByEmailAsync(Email);

            if (Email == null)
            {
                return View();
            }

            var code = await _userManager.GeneratePasswordResetTokenAsync(user);

            var url = Url.Action("ResetPassword", "Home", new
            {
                userId = user.Id,
                token = code
            });

            // email
            await _emailSender.SendEmailAsync(Email, "Reset Password", $"Parolanızı yenilemek için linke <a href='https://localhost:5001{url}'>tıklayınız.</a>");

            return View();
        }
        public IActionResult ResetPassword(string userId, string token)
        {
            if (userId == null || token == null)
            {
                return RedirectToAction("Index", "Home");
            }

            var model = new ResetPasswordModel { Token = token };

            return View();
        }
        [HttpPost]
        public async Task<IActionResult> ResetPassword(ResetPasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return RedirectToAction("Home", "Index");
            }

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.Password);

            if (result.Succeeded)
            {
                return RedirectToAction("Login", "Home");
            }

            return View(model);
        }
    }
}
