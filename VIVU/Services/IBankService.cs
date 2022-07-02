using System.Collections.Generic;
using System.Threading.Tasks;
using VIVU.Domains;

namespace VIVU.Services
{
    public interface IBankService
    {
        Task<Bank> GetDefaultBank();
        Task<Bank> GetById(int id);
        Task<List<BankParameter>> GetBankParameters(int bankId);
        Task<CreditCard> GetCreditCardByPrefix(string prefix,
            bool includeInstallments = false);
    }
}