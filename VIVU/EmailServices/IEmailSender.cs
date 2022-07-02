using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace VIVU.EmailServices
{
    public interface IEmailSender
    {
        // smtp => gmail, hotmail
        // api  => sendgrid

        Task SendEmailAsync(string email, string subject, string htmlMessage);
    }
}
