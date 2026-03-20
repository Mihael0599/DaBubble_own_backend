using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

[Authorize]
    public class ChatHub : Hub
    {
    private readonly AppDbContext _context;

    public ChatHub(AppDbContext context)
    {
        _context = context;
    }

    public async Task JoinChannel(string channelId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"channel_{channelId}");
    }

    public async Task SendMessage(int channelId, string content, int? parentMessageId = null)
    {
    var senderId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var message = new Message
        {
            Content = content,
            SenderId = senderId,
            ChannelId = channelId,
            ParentMessageId = parentMessageId,
            SentAt = DateTime.UtcNow,
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        await Clients.Group($"channel_{channelId}").SendAsync("ReceiveMessage", message);
    }

    }

