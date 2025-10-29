import { transporter } from "@/utils/mail";
import { NextResponse } from "next/server";

const RATE_LIMIT = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { name, email, message, company } = await req.json();

    // 🧠 Honeypot (bots often fill hidden fields)
    if (company && company.trim() !== "") {
      return NextResponse.json(
        { message: "Spam detected." },
        { status: 400 }
      );
    }

    // 🚫 Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    // 🧹 Sanitize inputs to avoid email header injection
    const safeName = name.replace(/[\r\n]/g, " ").trim();
    const safeEmail = email.replace(/[\r\n]/g, "").trim();
    const safeMessage = message.trim();

    // ⏱️ Simple in-memory rate limiting
    const now = Date.now();
    const requests = RATE_LIMIT.get(ip) || [];
    const recent = requests.filter(ts => now - ts < RATE_LIMIT_WINDOW);

    if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { message: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    RATE_LIMIT.set(ip, [...recent, now]);

    // 📩 Send admin email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: "New Contact Form Submission",
      text: `Name: ${safeName}\nEmail: ${safeEmail}\nMessage:\n${safeMessage}`,
      html: `
        <p><b>Name:</b> ${safeName}</p>
        <p><b>Email:</b> ${safeEmail}</p>
        <p><b>Message:</b></p>
        <p>${safeMessage}</p>
      `,
    });

    // 📬 Auto-reply to user
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: safeEmail,
      subject: "Thank You for Contacting Us",
      html: `
        <p>Hi ${safeName},</p>
        <p>Thank you for reaching out to us. We will get back to you as soon as possible.</p>
        <p>Best regards,<br />Meepletron Team</p>
      `,
    });

    return NextResponse.json({ message: "Request sent successfully!" }, { status: 200 });
  } catch (err) {
    console.error("Error in contact form:", err);
    return NextResponse.json(
      { message: "Unable to send request." },
      { status: 500 }
    );
  }
}

