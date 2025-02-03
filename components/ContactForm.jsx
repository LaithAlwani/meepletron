// components/ContactForm.js
"use client";
import { useState } from "react";
import Loader from "@/components/Loader";
import CustomButton from "./CustomeButton";
import toast from "react-hot-toast";

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const { message } = await response.json();
      if (response.ok) {
        toast.success(message);
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error("Error sending message. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-6">
      <div className="max-w-xl mx-auto p-6 bg-gray-200 dark:bg-slate-800 rounded-lg shadow-md shadow-gray-400 dark:shadow-slate-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Need Help or Have a Suggestion?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Tell us what’s on your mind, and we’ll get back to you as soon as possible!
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-3 border rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            rows="4"
            required></textarea>
          <CustomButton className="w-full" disabled={loading}>
            {loading ? <Loader width="1.5rem" /> : "Send Message"}
          </CustomButton>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
