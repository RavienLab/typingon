export function resetPasswordTemplate(link: string) {
  return `
  <div style="font-family:Arial;padding:20px">
    <h2>Reset your password</h2>

    <p>You requested a password reset.</p>

    <p>
      <a href="${link}" style="
        background:#2563eb;
        color:white;
        padding:10px 16px;
        text-decoration:none;
        border-radius:6px;
      ">
        Reset Password
      </a>
    </p>

    <p>This link expires in 30 minutes.</p>

    <p>If you didn't request this, ignore this email.</p>
  </div>
  `;
}