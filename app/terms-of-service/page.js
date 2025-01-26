// terms-of-service.js
export const metadata = {
  title: "Terms of Service",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function TermsOfService() {
  return (
    <div className="flex  justify-center py-12 px-6">
      <div className="max-w-xl w-full p-4">
        <h1 className="text-3xl font-bold mb-6 ">Terms of Service</h1>
        <p className=" mb-4">
          Welcome to Meeple Tron! These Terms of Service (“Terms”) govern your use of our platform.
          Please read them carefully before using the service.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">1. Eligibility</h2>
        <p className="text-gray-700 mb-4">
          You must be at least 13 years old to use our services. By using Meeple Tron, you confirm
          that you meet this requirement.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">2. Prohibited Use</h2>
        <p className="text-gray-700 mb-4">
          You agree not to use the service for any unlawful purposes or in a way that violates these
          Terms, including uploading harmful content or interfering with our systems.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">3. Intellectual Property</h2>
        <p className="text-gray-700 mb-4">
          All content and trademarks on Meeple Tron are the property of Meeple Tron or its
          licensors. Unauthorized use is prohibited.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">4. Termination</h2>
        <p className="text-gray-700 mb-4">
          We reserve the right to suspend or terminate your access to Meeple Tron at our sole
          discretion if you violate these Terms.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-4 ">
          5. Limitation of Liability
        </h2>
        <p className=" mb-4">
          Meeple Tron is not liable for any damages arising from your use of our services. Our
          liability is limited to the fullest extent permitted by law.
        </p>
        <p className=" mt-6">
          By using Meeple Tron, you agree to these Terms. If you have any questions, contact us at
          [Insert Email Address].
        </p>
      </div>
    </div>
  );
}
