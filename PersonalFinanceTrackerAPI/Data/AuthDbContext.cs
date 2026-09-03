using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PersonalFinanceTrackerAPI.Models;
namespace PersonalFinanceTrackerAPI.Data
{
    public class AuthDbContext:IdentityDbContext<ApplicationUser>
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options)
                : base(options)
        {
        }

    }
}
