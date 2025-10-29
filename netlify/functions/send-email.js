// netlify/functions/send-email.js
import nodemailer from "nodemailer";

export async function handler(event) {
  try {
    // 1) Récupérer la charge envoyée par le front
    const { name, email, message } = JSON.parse(event.body || "{}");

    // 2) Transport Gmail via mot de passe d'application (stocké sur Netlify)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ecommindagency@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD, // <-- variable d'env Netlify
      },
    });

    // 3) Construire l'e-mail
    const mailOptions = {
      from: `"Ecommind Agency" <ecommindagency@gmail.com>`,
      to: "ecommindagency@gmail.com", // tu peux mettre aussi le prospect en CC si tu veux
      subject: "📩 Nouveau prospect détecté – Démo Ecommind",
      html: `
        <div style="font-family: Inter, system-ui, Arial; line-height:1.6">
          <h2 style="margin:0 0 8px;color:#C9A55E;">Nouveau message reçu</h2>
          <p><b>Nom :</b> ${name || "Inconnu"}</p>
          <p><b>Email :</b> ${email || "Non précisé"}</p>
          <p><b>Message :</b> ${message || "—"}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="color:#888;margin:0">Ecommind — Captiver. Déclencher. Convertir.</p>
        </div>
      `,
    };

    // 4) Envoi
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email envoyé ✅" }),
    };
  } catch (err) {
    console.error("Erreur d’envoi:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
