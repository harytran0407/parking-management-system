using System.Text.Json.Serialization;
namespace ParkingManagement.DTOs.Auth
{
    public class GoogleLoginRequestDto
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        public string GetTokenChecked()
        {
            if (!string.IsNullOrEmpty(AccessToken)) return AccessToken;
            return string.Empty;
        }
    }
}
