public class SendMessageDto
{
    public string Content { get; set; } = "";
    public int? ChannelId { get; set; }
    public int? ParentMessageId { get; set; }
}