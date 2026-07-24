namespace ParkingManagement.Utils
{
    /// <summary>
    /// Single source of truth for the in-memory cache key used to instantly kick out
    /// a user the moment they're banned, regardless of which endpoint banned them
    /// (AdminController for regular users, StaffController for ParkingStaff) and
    /// regardless of whether their JWT has expired yet.
    ///
    /// Set the key via IMemoryCache.Set(BanCacheKeys.For(userId), true) when banning.
    /// Remove it via IMemoryCache.Remove(BanCacheKeys.For(userId)) when unbanning.
    /// UserBanCheckMiddleware checks it on every authenticated request.
    /// </summary>
    public static class BanCacheKeys
    {
        private const string Prefix = "UserBanned_";

        public static string For(string userId) => $"{Prefix}{userId}";
    }
}