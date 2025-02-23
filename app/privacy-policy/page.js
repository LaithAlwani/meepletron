// privacy-policy.js
export const metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="  flex  justify-center py-12 px-6">
      <div className="max-w-xl w-full   p-4">
        <h1 className="text-3xl font-bold mb-6 ">Privacy Policy</h1>
        <p className=" mb-4">
          Meeple Tron values your privacy. This page outlines how we collect, use, and protect your
          information when you use our services.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">1. Information We Collect</h2>
        <p className=" mb-4">
          We may collect personal information such as your name, email address, and usage data when
          you interact with our platform.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">
          2. How We Use Your Information
        </h2>
        <p className=" mb-4">
          We use the information to provide and improve our services, respond to your inquiries, and
          send updates about Meeple Tron.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">
          3. Sharing Your Information
        </h2>
        <p className=" mb-4">
          We do not sell or share your personal information with third parties except as required by
          law or to provide our services.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">4. Your Privacy Choices</h2>
        <p className=" mb-4">
          You can contact us to access, update, or delete your personal information at any time by
          emailing us at [Insert Email Address].
        </p>
        <p className=" mt-6">
          If you have questions about our privacy practices, please reach out to us.
        </p>
      </div>
    </div>
  );
}
