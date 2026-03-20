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

    [HttpPost]
    public async Task<ActionResult<Message>> SendMessage(Message message)
    {
        message.SenderId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        message.SentAt = DateTime.UtcNow;

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();
        return Ok(message);
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
    }
