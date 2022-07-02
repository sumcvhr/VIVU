using Glimpse.AspNet.Tab;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VIVU.EmailServices;
using VIVU.Identity;
using VIVU.Models;
using VIVU.Payment;
using VIVU.Services;

namespace VIVU
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContext<ApplicationContext>(options => options.UseSqlServer(Configuration.GetConnectionString("DataConnection")));
            services.AddIdentity<IdentityUser, IdentityRole>().AddDefaultUI().AddEntityFrameworkStores<ApplicationContext>().AddDefaultTokenProviders();
            //        services.AddIdentity<IdentityUser, IdentityRole>(options => options.SignIn.RequireConfirmedAccount = true)
            //.AddEntityFrameworkStores<ApplicationContext>();
            services.AddMvc()
  .AddSessionStateTempDataProvider();
            services.AddSession();

            //register db services
            services.AddScoped<IBankService, BankService>();
            services.AddScoped<IPaymentService, PaymentService>();

            //register common payment services
            services.AddPaymentServices();

            services.AddScoped<IEmailSender, SmtpEmailSender>(i =>
               new SmtpEmailSender(
                   Configuration["EmailSender:Host"],
                   Configuration.GetValue<int>("EmailSender:Port"),
                   Configuration.GetValue<bool>("EmailSender:EnableSSL"),
                   Configuration["EmailSender:UserName"],
                   Configuration["EmailSender:Password"])
              );
            services.Configure<IdentityOptions>(options =>
            {
                // password
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 6;
                options.Password.RequireNonAlphanumeric = true;

                // Lockout                
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.AllowedForNewUsers = true;

                // options.User.AllowedUserNameCharacters = "";
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = true;
                options.SignIn.RequireConfirmedPhoneNumber = false;
            });

            services.ConfigureApplicationCookie(options =>
            {
                options.LoginPath = "/Home/Login";
                options.LogoutPath = "/Home/Logout";
                //options.AccessDeniedPath = "/Courier/accessdenied";
                options.SlidingExpiration = true;
                options.ExpireTimeSpan = TimeSpan.FromDays(365);
                options.Cookie = new CookieBuilder
                {
                    HttpOnly = true,
                    Name = ".VIVU.Security.Cookie",
                    SameSite = SameSiteMode.Strict
                };
            });
            services.AddControllersWithViews();

            services.AddControllers();

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSession();
            app.UseRouting();
            app.UseAuthorization();



            //app.UseMvc(routes =>
            //{
            //    routes.MapRoute(
            //        name: "areaRoute",
            //        template: "{area:exists}/{controller=Home}/{action=PaymentPage}/{id?}");

            //    routes.MapRoute(
            //        name: "default",
            //        template: "{controller=Home}/{action=PaymentPage}/{id?}");
            //});
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Login}/{id?}");
            });
            //app.UseEndpoints(endpoints =>
            //{
            //    //confirm
            //    endpoints.MapControllerRoute(
            //        name: "Confirm",
            //        pattern: "payment/confirm/{paymentId:Guid?}",
            //        defaults: new { action = "Confirm", controller = "Home" });

            //    //callback
            //    endpoints.MapControllerRoute(
            //        name: "Callback",
            //        pattern: "payment/callback/{paymentId:Guid?}",
            //        defaults: new { action = "Callback", controller = "Home" });

            //    endpoints.MapDefaultControllerRoute();
            //});
        }
    }
}
