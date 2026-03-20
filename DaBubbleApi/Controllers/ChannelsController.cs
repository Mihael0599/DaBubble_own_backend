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

}
