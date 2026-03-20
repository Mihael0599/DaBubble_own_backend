using MailKit.Net.Smtp;
using MimeKit;

    public class EmailService
    {
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config) 
    {
        _config = config;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(
            _config["EmailSettings:SenderName"],
            _config["EmailSettings:SenderEmail"]));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = "Passwort zurücksetzen";

        email.Body = new TextPart("html")
        {
            Text = $@"
                <h2>Passwort zurücksetzen</h2>
                <p>Klicke auf den Link um dein Passwort zurückzusetzen:</p>
                <a href='{resetLink}'>Passwort zurücksetzen</a>
                <p>Der Link ist 24 Stunden gültig.</p>"
        };

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(
            _config["EmailSettings:Host"],
            int.Parse(_config["EmailSettings:Port"]!),
            false);
        await smtp.AuthenticateAsync(
            _config["EmailSettings:SenderEmail"],
           _config["EmailSettings:Password"]);
        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }
    
    
}

