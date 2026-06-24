using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace ParkingManagement.Services
{
    public class VnPayLibrary
    {
        // Dùng SortedDictionary với bộ so sánh StringComparer.Ordinal để ép chuẩn ASCII
        private readonly SortedDictionary<string, string> _requestData = new SortedDictionary<string, string>(StringComparer.Ordinal);
        private readonly SortedDictionary<string, string> _responseData = new SortedDictionary<string, string>(StringComparer.Ordinal);

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData[key] = value;
            }
        }

        public void AddResponseData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _responseData[key] = value;
            }
        }

        public string GetResponseData(string key)
        {
            return _responseData.TryGetValue(key, out var val) ? val : string.Empty;
        }

        public string CreateRequestUrl(string baseUrl, string hashSecret)
        {
            var queryString = new StringBuilder();
            var rawData = new StringBuilder();

            foreach (var kv in _requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    // QueryString lên URL bắt buộc URL Encode
                    if (queryString.Length > 0) queryString.Append("&");
                    queryString.Append(Uri.EscapeDataString(kv.Key) + "=" + Uri.EscapeDataString(kv.Value));

                    // RawData để băm tuyệt đối KHÔNG URL Encode
                    if (rawData.Length > 0) rawData.Append("&");
                    rawData.Append(kv.Key + "=" + kv.Value);
                }
            }

            string rawDataStr = rawData.ToString();
            string secureHash = HmacSha512(hashSecret, rawDataStr);

            string paymentUrl = baseUrl + "?" + queryString.ToString() + "&vnp_SecureHash=" + secureHash;
            return paymentUrl;
        }

        public bool ValidateSignature(string inputHash, string hashSecret)
        {
            var rawData = new StringBuilder();
            foreach (var kv in _responseData)
            {
                if (kv.Key != "vnp_SecureHash" && kv.Key != "vnp_SecureHashType")
                {
                    if (rawData.Length > 0) rawData.Append("&");
                    rawData.Append(kv.Key + "=" + kv.Value);
                }
            }

            string rawDataStr = rawData.ToString();
            string myChecksum = HmacSha512(hashSecret, rawDataStr);

            return myChecksum.Equals(inputHash, StringComparison.OrdinalIgnoreCase);
        }

        public static string HmacSha512(string key, string inputData)
        {
            var hash = new StringBuilder();
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            
            // Đồng bộ cách xử lý khoảng trắng của VNPay (đổi khoảng trắng thành dấu cộng trước khi băm)
            string formattedInput = inputData.Replace(" ", "+");
            byte[] inputBytes = Encoding.UTF8.GetBytes(formattedInput);
            
            using (var hmac = new HMACSHA512(keyBytes))
            {
                byte[] hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }
            return hash.ToString();
        }
    }
}