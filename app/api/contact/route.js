import { transporter } from "@/utils/mail";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { name, email, message } = await req.json();
  
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: "New Contact Form Submission",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html:`Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Thank You for Contacting Us",
      text: `Hi ${name},\n\nThank you for reaching out to us. We will get back to you as soon as possible.\n\nBest regards,\nMeepletron Team`,
      html:`Hi ${name},\n\nThank you for reaching out to us. We will get back to you as soon as possible.\n\nBest regards,\nMeepletron Team`,
    });
    return NextResponse.json({ message: `Request sent successfully!` }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: `Unable to send request` }, { status: 500 });
  }
}
