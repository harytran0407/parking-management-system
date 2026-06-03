using System.Threading.Tasks;
using ParkingManagement.Models;

namespace ParkingManagement.Repositories
{
    public interface IIncidentRepository
    {
        Task CreateIncidentLogAsync(IncidentLog incident);
        Task<IncidentLog?> GetIncidentByIdAsync(int logId);
    }
}