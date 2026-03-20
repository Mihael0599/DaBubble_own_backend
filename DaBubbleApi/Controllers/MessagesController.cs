using System.Security.Claims;
using System.Threading.Channels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Authorize]
[ApiController]
[Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
    private readonly AppDbContext _context; 

    public MessagesController (AppDbContext context)
    {
        _context = context; 
    }

    [HttpGet("channel/{channelId}")]
    public async Task<ActionResult<List<Message>>> GetChannelMessages(int channelId)
    {
        return await _context.Messages
            .Where(m => m.ChannelId == channelId && m.ParentMessageId == null)
            .Include(m => m.Sender)
            .Include(m => m.Reactions)
            .OrderBy(m => m.SentAt)
            .ToListAsync();
    }

    [HttpGet("{id}/thread")]
     public async Task<ActionResult<List<Message>>> GetThread(int id)
    {
        return await _context.Messages
            .Where(m => m.ParentMessageId == id)
            .Include(m => m.Sender)
            .Include(m => m.Reactions)
            .OrderBy(m => m.SentAt)
            .ToListAsync();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessage(int id)
    {
        var message = await _context.Messages.FindAsync(id);
        if (message == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        if (message.SenderId != userId) return Forbid();

        _context.Messages.Remove(message);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMessage(int id, [FromBody] UpdateMessageDto dto)
    {
        var message = await _context.Messages.FindAsync(id);
        if (message == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (message.SenderId != userId) return Forbid();

        message.Content = dto.Content;
        await _context.SaveChangesAsync();
        return Ok(message);
    }

    [HttpPost("{id}/reactions")]
    public async Task<IActionResult> AddReaction(int id, [FromBody] AddReactionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var existing = await _context.Reactions
            .FirstOrDefaultAsync(r => r.MessageId == id && r.UserId == userId && r.Emoji == dto.Emoji);

        if (existing != null)
        {
            _context.Reactions.Remove(existing);
        }
        else
        {
            _context.Reactions.Add(new Reaction
            {
                MessageId = id,
                UserId = userId,
                Emoji = dto.Emoji
            });
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<Message>>> SearchMessages([FromQuery] string keyword)
    {
        return await _context.Messages
            .Where(m => m.Content.Contains(keyword))
            .Include(m => m.Sender)
            .Include(m => m.Reactions)
            .OrderByDescending(m => m.SentAt)
            .Take(20)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Message>> SendMessage(SendMessageDto dto)
    {
        var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var message = new Message
        {
            Content = dto.Content,
            SenderId = senderId,
            ChannelId = dto.ChannelId,
            ParentMessageId = dto.ParentMessageId,
            SentAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();
        return Ok(message);
    }
}
