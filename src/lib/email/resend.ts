import "server-only";

type SendEmailInput = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

export async function sendEmail({ html, subject, text, to }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Marginalia & Co. <onboarding@resend.dev>";
  if (!apiKey) throw new Error("RESEND_API_KEY is required to send auth email.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!response.ok) {
    let message = "Resend email request failed.";
    try {
      const body = await response.json();
      if (typeof body?.message === "string") message = body.message;
    } catch {
      // Keep the generic message if Resend returns a non-JSON error.
    }
    throw new Error(message);
  }
}
