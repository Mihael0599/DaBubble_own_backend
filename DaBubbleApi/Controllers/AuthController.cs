using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;

[ApiController]
[Route("api/controller")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly TokenService _tokenService;
        private readonly EmailService _emailService;
        
        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            TokenService tokenService,
            EmailService emailService)
    {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _emailService = emailService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        if (await _userManager.FindByEmailAsync(dto.Email) != null)
            return BadRequest("E-mail wird bereits verwendet");

        var user = new AppUser
        {
            DisplayName = dto.DisplayName,
            Email = dto.Email,
            UserName = dto.Email
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return new AuthResponseDto
        {
            Token = _tokenService.CreateToken(user),
            Email = user.Email,
            DisplayName = user.DisplayName
        };
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);

        if (user == null) return Unauthorized("Ungültige E-Mail");

        var result = await _signInManager
            .CheckPasswordSignInAsync(user, dto.Password, false);

        if (!result.Succeeded) return Unauthorized("Falsches Passwort");

        return new AuthResponseDto
        {
            Token = _tokenService.CreateToken(user),
            Email = user.Email!,
            DisplayName = user.DisplayName
        };
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return Ok();

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token); 
        var resetLink = $"http://localhost:4200/reset-password?email={email}&token={encodedToken}";

        await _emailService.SendPasswordResetEmailAsync(email, resetLink);
        return Ok("E-mail wurde gesendet");
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return BadRequest("User nicht gefunden");

        var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("Password erfolgreich geändert");
    }

}

