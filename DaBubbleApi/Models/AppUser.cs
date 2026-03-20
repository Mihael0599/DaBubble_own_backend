using DaBubbleApi.Models;
using Microsoft.AspNetCore.Identity;

public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
