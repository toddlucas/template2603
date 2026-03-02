using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Options;

using SendGrid;
using SendGrid.Helpers.Mail;

namespace Base2.Identity;

public class AuthSendGridSender(
    ILogger<AuthSendGridSender> logger,
    IOptions<AuthSendGridOptions> optionsAccessor) : IEmailSender
{
    private readonly ILogger _logger = logger;
    private readonly AuthSendGridOptions _options = optionsAccessor.Value;

    public async Task SendEmailAsync(string toEmail, string subject, string message)
    {
        if (string.IsNullOrEmpty(_options.SendGridKey))
        {
            // throw new Exception("Null SendGridKey");
            _logger.LogWarning("SendGrid key isn't configured.");
            return;
        }

        await Execute(_options.SendGridKey, subject, message, toEmail);
    }

    public async Task Execute(string apiKey, string subject, string message, string toEmail)
    {
        var client = new SendGridClient(apiKey);
        var msg = new SendGridMessage()
        {
            From = new EmailAddress("joe@contoso.com", "Password Recovery"),
            Subject = subject,
            PlainTextContent = message,
            HtmlContent = message
        };

        msg.AddTo(new EmailAddress(toEmail));

        // Disable click tracking.
        // See https://sendgrid.com/docs/User_Guide/Settings/tracking.html
        msg.SetClickTracking(false, false);
        var response = await client.SendEmailAsync(msg);
        _logger.LogInformation(response.IsSuccessStatusCode
                               ? "Email to {ToEmail} queued successfully."
                               : "Failed to send email to {ToEmail}.", toEmail);
    }
}
