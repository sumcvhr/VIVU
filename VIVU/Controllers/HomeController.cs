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
using VIVU.Helpers;
using System.Collections.Specialized;
using VIVU.Services;
using Microsoft.AspNetCore.Mvc.Rendering;
using VIVU.Payment;
using VIVU.Requests;
using VIVU.Domains;
using Microsoft.Net.Http.Headers;
using VIVU.Results;

namespace VIVU.Controllers
{

    [AutoValidateAntiforgeryToken]
    public class HomeController : Controller
    {
        private const string PaymentSessionName = "PaymentInfo";
        private const string PaymentResultSessionName = "PaymentResult";

        private readonly IBankService _bankService;
        private readonly IPaymentService _paymentService;
        private readonly IHtmlHelper _htmlHelper;
        private readonly IPaymentProviderFactory _paymentProviderFactory;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly ApplicationContext _context;
        private readonly ILogger<HomeController> _logger;
        private IEmailSender _emailSender;
        public HomeController(IEmailSender emailSender, 
            ILogger<HomeController> logger, ApplicationContext context,
            UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager,
            IBankService bankService,
            IPaymentService paymentService,
            IHtmlHelper htmlHelper,
            IPaymentProviderFactory paymentProviderFactory)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _logger = logger;
            _emailSender = emailSender;
            _bankService = bankService;
            _paymentService = paymentService;
            _htmlHelper = htmlHelper;
            _paymentProviderFactory = paymentProviderFactory;
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
                    ModelState.AddModelError("", "Bilinmeyen hata oldu lütfen tekrar deneyiniz.");
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
            //veri.activities = _context.Activity.Where(P => P.Id == Id).ToList();
            return View("Index", veri);
        }

        public IActionResult Privacy()
        {
            return View();
        }
        public IActionResult PaymentPage()
        {
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            TempData["CreditCard"] = veri;

            //return RedirectToAction("ThreeDGate", veri);
            return View(veri);

        }
        [HttpPost]
        public async Task<IActionResult> PaymentPage([FromForm] PaymentViewModel model)
        {
            try
            {
                //gateway request
                PaymentGatewayRequest gatewayRequest = new PaymentGatewayRequest
                {
                    CardHolderName = model.CardHolderName,
                    //clear credit card unnecessary characters
                    CardNumber = model.CardNumber?.Replace(" ", string.Empty).Replace(" ", string.Empty),
                    ExpireMonth = model.ExpireMonth,
                    ExpireYear = model.ExpireYear,
                    CvvCode = model.CvvCode,
                    CardType = model.CardType,
                    Installment = model.Installment,
                    TotalAmount = model.TotalAmount,
                    OrderNumber = Guid.NewGuid().ToString(),
                    CurrencyIsoCode = "949",
                    LanguageIsoCode = "tr",
                    CustomerIpAddress = HttpContext.Connection.RemoteIpAddress.ToString()
                };

                //bank
                Bank bank = await _bankService.GetById(model.BankId.Value);
                gatewayRequest.BankName = (Payment.BankNames)Enum.Parse<BankNames>(bank.SystemName);

                //bank parameters
                System.Collections.Generic.List<BankParameter> bankParameters = await _bankService.GetBankParameters(bank.Id);
                gatewayRequest.BankParameters = bankParameters.ToDictionary(key => key.Key, value => value.Value);

                //create payment transaction
                PaymentTransaction payment = new PaymentTransaction
                {
                    OrderNumber = Guid.Parse(gatewayRequest.OrderNumber),
                    UserIpAddress = gatewayRequest.CustomerIpAddress,
                    UserAgent = HttpContext.Request.Headers[HeaderNames.UserAgent],
                    BankId = model.BankId.Value,
                    CardPrefix = gatewayRequest.CardNumber.Substring(0, 6),
                    CardHolderName = gatewayRequest.CardHolderName,
                    Installment = model.Installment,
                    TotalAmount = model.TotalAmount,
                    BankRequest = JsonConvert.SerializeObject(gatewayRequest)
                };

                //mark as created
                payment.MarkAsCreated();

                //insert payment transaction
                await _paymentService.Insert(payment);

                var responseModel = new
                {
                    GatewayUrl = new Uri($"{Request.GetHostUrl(false)}{Url.RouteUrl("Confirm", new { paymentId = payment.OrderNumber })}"),
                    Message = "Redirecting to gateway..."
                };

                return Ok(responseModel);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);

                return Ok(new { errorMessage = "İşlem sırasında bir hata oluştu." });
            }
        }

        public async Task<IActionResult> Confirm(Guid paymentId)
        {
            if (paymentId == Guid.Empty)
            {
                VerifyGatewayResult failModel = VerifyGatewayResult.Failed("Ödeme bilgisi geçersiz.");
                return View("Fail", failModel);
            }

            //get transaction by identifier
            PaymentTransaction payment = await _paymentService.GetByOrderNumber(paymentId);
            if (payment == null)
            {
                VerifyGatewayResult failModel = VerifyGatewayResult.Failed("Ödeme bilgisi geçersiz.");
                return View("Fail", failModel);
            }

            PaymentGatewayRequest bankRequest = JsonConvert.DeserializeObject<PaymentGatewayRequest>(payment.BankRequest);
            if (bankRequest == null)
            {
                VerifyGatewayResult failModel = VerifyGatewayResult.Failed("Ödeme bilgisi geçersiz.");
                return View("Fail", failModel);
            }

            if (!IPAddress.TryParse(bankRequest.CustomerIpAddress, out IPAddress ipAddress))
            {
                bankRequest.CustomerIpAddress = HttpContext.Connection.RemoteIpAddress.ToString();
            }

            if (bankRequest.CustomerIpAddress == "::1")
            {
                bankRequest.CustomerIpAddress = "127.0.0.1";
            }

            IPaymentProvider provider = _paymentProviderFactory.Create((BankNames)bankRequest.BankName);

            //set callback url
            bankRequest.CallbackUrl = new Uri($"{Request.GetHostUrl(false)}{Url.RouteUrl("Callback", new { paymentId = payment.OrderNumber })}");

            //gateway request
            PaymentGatewayResult gatewayResult = await provider.ThreeDGatewayRequest(bankRequest);
            //check result status
            if (!gatewayResult.Success)
            {
                VerifyGatewayResult failModel = VerifyGatewayResult.Failed(gatewayResult.ErrorMessage);
                return View("Fail", failModel);
            }

            //html content
            if (gatewayResult.HtmlContent)
            {
                return View(model: gatewayResult.HtmlFormContent);
            }

            //create form submit with parameters
            string model = _paymentProviderFactory.CreatePaymentFormHtml(gatewayResult.Parameters, gatewayResult.GatewayUrl);
            return View(model: model);
        }

        [HttpPost]
        public async Task<IActionResult> GetInstallments([FromBody] InstallmentViewModel model)
        {
            //add cash option
            model.AddCashRate(model.TotalAmount);

            //get card prefix by prefix
            CreditCard creditCard = await _bankService.GetCreditCardByPrefix(model.Prefix, true);
            if (creditCard == null)
            {
                //get default bank
                Bank defaultBank = await _bankService.GetDefaultBank();

                if (defaultBank == null || !defaultBank.Active)
                {
                    return Ok(new { errorMessage = "Ödeme için aktif banka bulunamadı." });
                }

                model.BankId = defaultBank.Id;
                model.BankLogo = defaultBank.LogoPath;
                model.BankName = defaultBank.Name;

                return Ok(model);
            }

            //get bank by identifier
            Bank bank = await _bankService.GetById(creditCard.BankId);

            //get default bank
            if (bank == null || !bank.Active)
            {
                bank = await _bankService.GetDefaultBank();
            }

            if (bank == null || !bank.Active)
            {
                return Ok(new { errorMessage = "Ödeme için aktif banka bulunamadı." });
            }

            //prepare installment model
            foreach (CreditCardInstallment installment in creditCard.Installments)
            {
                decimal installmentAmount = model.TotalAmount;
                decimal installmentTotalAmount = installmentAmount;

                if (installment.InstallmentRate > 0)
                {
                    installmentTotalAmount = Math.Round(model.TotalAmount + ((model.TotalAmount * installment.InstallmentRate) / 100), 2, MidpointRounding.AwayFromZero);
                }

                installmentAmount = Math.Round(installmentTotalAmount / installment.Installment, 2, MidpointRounding.AwayFromZero);

                model.InstallmentRates.Add(new InstallmentViewModel.InstallmentRate
                {
                    Text = $"{installment.Installment} Taksit",
                    Installment = installment.Installment,
                    Rate = installment.InstallmentRate,
                    Amount = installmentAmount.ToString("N2"),
                    AmountValue = installmentAmount,
                    TotalAmount = installmentTotalAmount.ToString("N2"),
                    TotalAmountValue = installmentTotalAmount
                });
            }

            //set manufacturer card flag
            model.BankId = bank.Id;
            model.BankLogo = bank.LogoPath;
            model.BankName = bank.Name;

            return Ok(model);
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Callback(Guid paymentId, IFormCollection form)
        {
            if (paymentId == Guid.Empty)
            {
                VerifyGatewayResult failModel = VerifyGatewayResult.Failed("Ödeme bilgisi geçersiz.");
                return View("Fail", failModel);
            }

            //get transaction by identifier
            PaymentTransaction payment = await _paymentService.GetByOrderNumber(paymentId);
            if (payment == null)
            {
                VerifyGatewayResult failModel = VerifyGatewayResult.Failed("Ödeme bilgisi geçersiz.");
                return View("Fail", failModel);
            }

            PaymentGatewayRequest bankRequest = JsonConvert.DeserializeObject<PaymentGatewayRequest>(payment.BankRequest);
            if (bankRequest == null)
            {
                VerifyGatewayResult failModel = VerifyGatewayResult.Failed("Ödeme bilgisi geçersiz.");
                return View("Fail", failModel);
            }

            //create provider
            IPaymentProvider provider = _paymentProviderFactory.Create((BankNames)bankRequest.BankName);
            VerifyGatewayRequest verifyRequest = new VerifyGatewayRequest
            {
                BankName = bankRequest.BankName,
                BankParameters = bankRequest.BankParameters
            };

            VerifyGatewayResult verifyResult = await provider.VerifyGateway(verifyRequest, bankRequest, form);
            verifyResult.OrderNumber = bankRequest.OrderNumber;

            //save bank response
            payment.BankResponse = JsonConvert.SerializeObject(new
            {
                verifyResult,
                parameters = form.Keys.ToDictionary(key => key, value => form[value].ToString())
            });

            payment.TransactionNumber = verifyResult.TransactionId;
            payment.ReferenceNumber = verifyResult.ReferenceNumber;
            payment.BankResponse = verifyResult.Message;

            if (verifyResult.Installment > 1)
            {
                payment.Installment = verifyResult.Installment;
            }

            if (verifyResult.ExtraInstallment > 1)
            {
                payment.ExtraInstallment = verifyResult.ExtraInstallment;
            }

            if (verifyResult.Success)
            {
                //mark as paid
                payment.MarkAsPaid(DateTime.Now);
                await _paymentService.Update(payment);

                return View("Success", verifyResult);
            }

            //mark as not failed(it's mean error)
            payment.MarkAsFailed(verifyResult.ErrorMessage, $"{verifyResult.Message} - {verifyResult.ErrorCode}");

            //update payment transaction
            await _paymentService.Update(payment);

            return View("Fail", verifyResult);
        }

        public async Task<IActionResult> Completed([FromRoute(Name = "id")] Guid orderNumber)
        {
            //get order by order number
            PaymentTransaction payment = await _paymentService.GetByOrderNumber(orderNumber, includeBank: true);
            if (payment == null)
            {
                return RedirectToAction("Index", "Home");
            }

            //create completed view model
            CompletedViewModel model = new CompletedViewModel
            {
                OrderNumber = payment.OrderNumber,
                TransactionNumber = payment.TransactionNumber,
                ReferenceNumber = payment.ReferenceNumber,
                BankId = payment.BankId,
                BankName = payment.Bank?.Name,
                CardHolderName = payment.CardHolderName,
                Installment = payment.Installment,
                TotalAmount = payment.TotalAmount,
                PaidDate = payment.PaidDate,
                CreateDate = payment.CreateDate
            };

            return View(model);
        }
        [HttpGet]
        public IActionResult ActivityForm()
        {
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);

            veri.categories = _context.Category.ToList();
            return View(veri);
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
            veri.activity = model.activity;
            if (veri != null)
            {
                string filePath = "";
              
                var activity = new Identity.Activity()
                {
                    ActivityName = model.activity.ActivityName,
                    ActivityDate = model.activity.ActivityDate,
                    ActivityDetail = model.activity.ActivityDetail,
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
                        string dosyaAdiOnEk = activity.ActivityDate.Day.ToString();
                        string dosyaAdi = dosyaAdiOnEk + "_" + dosya.FileName;
                        string dosyaYolu = Path.Combine(ustklasor.FullName + "/VIVU", $"wwwroot/Banner/{dosyaAdi}");
                        using (var stream = System.IO.File.Create(dosyaYolu))
                        {
                            dosya.CopyTo(stream);
                            activity.BannerAdress = "/Banner/" + dosyaAdi;
                        }

                    }
                }
                //var acategory = new Identity.ActivityCategory();
                //veri.acategory.ActivityId = model.activity.ActivtyId;
                //veri.acategory.CategoryId = model.category.Id;
                //_context.ActivityCategory.Add(acategory);
                //veri.activity.Cotegory = veri.acategory.Id;
                activity.Id = veri.user.Id;
                _context.Activity.Add(activity);
                _context.SaveChanges();      
            
                return RedirectToAction("ActivityForm");
              
            }


            ModelState.AddModelError("", "Bilinmeyen hata oldu lütfen tekrar deneyiniz.");
            return RedirectToAction("ActivityForm", "Home");
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
            VivuVM veri = new VivuVM();
            string oturumBilgi = HttpContext.Session.GetString("oturum");
            veri.user = JsonConvert.DeserializeObject<Identity.User>(oturumBilgi);
            return View("ProfilePage", veri);
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

        public IActionResult index1()
        {
            return View();
        }
    }
  
}
