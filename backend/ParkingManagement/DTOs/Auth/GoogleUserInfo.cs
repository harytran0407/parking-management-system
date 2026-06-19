<<<<<<< HEAD
using System.Text.Json.Serialization;
=======
﻿using System.Text.Json.Serialization;
>>>>>>> origin/main

namespace ParkingManagement.DTOs.Auth
{
    public class GoogleUserInfo
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("picture")]
        public string Picture { get; set; } = string.Empty;
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
