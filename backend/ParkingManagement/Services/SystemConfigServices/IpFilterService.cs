using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace ParkingManagement.Services.SystemConfigServices
{
    public interface IIpFilterService
    {
        bool IsBlocked(string ip);
        bool IsAllowed(string ip);
    }

    public class IpFilterService : IIpFilterService
    {
        private readonly HashSet<string> _allowed;
        private readonly HashSet<string> _blocked;

        public IpFilterService(IConfiguration configuration)
        {
            // Load lists from configuration: IpFiltering:Allowed and IpFiltering:Blocked
            var allowed = configuration.GetSection("IpFiltering:Allowed").Get<string[]>();
            var blocked = configuration.GetSection("IpFiltering:Blocked").Get<string[]>();

            _allowed = allowed != null ? new HashSet<string>(allowed) : new HashSet<string>();
            _blocked = blocked != null ? new HashSet<string>(blocked) : new HashSet<string>();
        }

        public bool IsBlocked(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip)) return false;
            if (_allowed.Contains(ip)) return false; // explicit allow overrides block
            return _blocked.Contains(ip);
        }

        public bool IsAllowed(string ip)
        {
            if (string.IsNullOrWhiteSpace(ip)) return false;
            return _allowed.Contains(ip);
        }
    }
}
