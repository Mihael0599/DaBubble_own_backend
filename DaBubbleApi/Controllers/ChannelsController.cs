using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

[Authorize]
[ApiController]
[Route("api/[controller]")]
    public class ChannelsController : ControllerBase
    {
    private readonly AppDbContext _context;

    public ChannelsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Channel>>> GetChannels()
    {
        return await _context.Channels.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Channel>> GetChannel(int id)
    {
        var channel = await _context.Channels.FindAsync(id);
        if (channel == null) return NotFound();
        return channel;
    }

    [HttpPost]
    public async Task<ActionResult<Channel>> CreateChannel(CreateChannelDto dto)
    {
        var channel = new Channel
        {
            Name = dto.Name,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        _context.Channels.Add(channel);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetChannel), new { id = channel.id }, channel);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateChannel(int id, CreateChannelDto dto)
    {
        var channel = await _context.Channels.FindAsync(id);
        if (channel == null) return NotFound();

        channel.Name = dto.Name;
        channel.Description = dto.Description;
        await _context.SaveChangesAsync();
        return Ok(channel);
    }

    [HttpPost("{id}/users")]
    public async Task<IActionResult> AddUserToChannel(int id, [FromBody] AddUserDto dto)
    {
        var channel = await _context.Channels.FindAsync(id);
        if (channel == null) return NotFound();
        // Wird später mit Channel-User Relation implementiert
        return Ok();
    }

    [HttpDelete("{id}/users/{userId}")]
    public async Task<IActionResult> RemoveUserFromChannel(int id, string userId)
    {
        var channel = await _context.Channels.FindAsync(id);
        if (channel == null) return NotFound();
        return Ok();
    }

    [HttpGet("{id}/users")]
    public async Task<IActionResult> GetChannelUsers(int id)
    {
        var messages = await _context.Messages
            .Where(m => m.ChannelId == id)
            .Include(m => m.Sender)
            .Select(m => new {
                id = m.Sender.Id,
                displayName = m.Sender.DisplayName,
                email = m.Sender.Email,
                avatarUrl = m.Sender.AvatarUrl
            })
            .Distinct()
            .ToListAsync();
        return Ok(messages);
    }
}
