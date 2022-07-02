using Microsoft.Extensions.DependencyInjection;

namespace VIVU.Payment
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddPaymentServices(this IServiceCollection services)
        {
            services.AddHttpClient();
            services.AddHttpContextAccessor();
            services.AddSingleton<IPaymentProviderFactory, PaymentProviderFactory>();

            return services;
        }
    }
}