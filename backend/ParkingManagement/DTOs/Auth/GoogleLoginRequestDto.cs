<<<<<<< HEAD
using System.Text.Json.Serialization;
=======
﻿using System.Text.Json.Serialization;
>>>>>>> origin/main
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
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
