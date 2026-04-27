"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { MdSend, MdCheckCircle } from "react-icons/md";
import CustomToast from "./CustomeToast";

const fieldClass =
  "peer w-full bg-transparent border-0 border-b-2 border-border pt-5 pb-1.5 text-sm text-foreground placeholder-transparent focus:outline-none focus:border-primary transition-colors";

const labelClass =
  "absolute left-0 top-1 text-xs font-medium text-subtle transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-subtle peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary pointer-events-none";

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const { message } = await res.json();
      if (!res.ok) { toast.error(message); return; }
      toast.custom((t) => <CustomToast message={message} id={t.id} />);
      setSent(true);
    } catch {
      toast.error("Error sending message. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: "", email: "", message: "", company: "" });
    setSent(false);
  };

  return (
    <section id="contact" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-lg border border-border-muted">

          {/* Left panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-primary p-10 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />

            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70 dark:text-slate-900/70 mb-4">
                Get In Touch
              </p>
              <h2 className="text-3xl font-bold text-primary-fg leading-snug mb-4">
                Have a suggestion or request?
              </h2>
              <p className="text-sm text-white/80 dark:text-slate-900/80 leading-relaxed">
                Tell us about a game you&apos;d like to see added, share feedback, or just say hi. We read every message.
              </p>
            </div>

            <div className="relative z-10 mt-10 space-y-3">
              {["Request a new game", "Report an issue", "Partnership inquiry"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-white/90 dark:text-slate-900/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-fg shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right panel — form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-surface p-10 flex flex-col justify-center"
          >
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center justify-center text-center gap-4 py-8"
                >
                  <MdCheckCircle size={52} className="text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Message sent!</h3>
                  <p className="text-sm text-muted">
                    Thanks for reaching out. We&apos;ll get back to you soon.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                >
                  {/* Honeypot */}
                  <input type="text" name="company" className="hidden" onChange={handleChange} />

                  <div className="relative">
                    <input type="text" name="name" id="cf-name" placeholder="Full Name"
                      value={formData.name} onChange={handleChange} className={fieldClass} />
                    <label htmlFor="cf-name" className={labelClass}>Full Name</label>
                  </div>

                  <div className="relative">
                    <input type="email" name="email" id="cf-email" placeholder="Email Address"
                      value={formData.email} onChange={handleChange} className={fieldClass} />
                    <label htmlFor="cf-email" className={labelClass}>Email Address</label>
                  </div>

                  <div className="relative">
                    <textarea name="message" id="cf-message" placeholder="Your message"
                      value={formData.message} onChange={handleChange} rows={4}
                      className={`${fieldClass} resize-none`} />
                    <label htmlFor="cf-message" className={labelClass}>Your message</label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {loading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <MdSend size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    )}
                    {loading ? "Sending…" : "Send Message"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
