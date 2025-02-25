// components/ContactForm.js
"use client";
import { useState } from "react";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";
import CustomToast from "./CustomeToast";
import { Button, Input, Textarea } from "./ui";

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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const { message } = await res.json();

      if (!res.ok) {
        return toast.error(message);
      }

      toast.custom((t) => <CustomToast message={message} id={t.id} />);

      setFormData({ name: "", email: "", message: "" });
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
          <Input
            placeholder="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <Input
            type="email"
            placeholder="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Textarea
            name="message"
            placeholder="Type message..."
            value={formData.message}
            onChange={handleChange}
          />
          <Button className="w-full" isLoading={loading}>
             Send Message
          </Button>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
