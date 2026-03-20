using DaBubbleApi.Models;

public class Message
    {
    public int Id { get; set; }
    public string Content { get; set; } = "";
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public string SenderId { get; set; } = "";
    public AppUser Sender { get; set; } = null!;

    public int? ChannelId { get; set; }
    public Channel? Channel { get; set; }

    public int? ParentMessageId { get; set; }
    public Message? ParentMessage { get; set; }

    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    }
