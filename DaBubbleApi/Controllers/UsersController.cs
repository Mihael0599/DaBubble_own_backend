using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;

    public UsersController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<List<object>>> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        return users.Select(u => (object)new
        {
            id = u.Id,
            displayName = u.DisplayName,
            email = u.Email,
            avatarUrl = u.AvatarUrl
        }).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        return new
        {
            id = user.Id,
            displayName = user.DisplayName,
            email = user.Email,
            avatarUrl = user.AvatarUrl
        };
    }

    [HttpPut("displayname")]
    public async Task<IActionResult> UpdateDisplayName([FromBody] UpdateDisplayNameDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();
        user.DisplayName = dto.DisplayName;
        await _userManager.UpdateAsync(user);
        return Ok();
    }

    [HttpPut("avatar")]
    public async Task<IActionResult> UpdateAvatar([FromBody] UpdateAvatarDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();
        user.AvatarUrl = dto.AvatarUrl;
        await _userManager.UpdateAsync(user);
        return Ok();
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        // Status wird später implementiert
        return Ok();
    }
}