import Image from "next/image";
import React from "react";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className=" bg-gray-200 dark:bg-blue-600 py-12">
      <div className="container mx-auto max-w-xl px-4">
        <h3 className="text-3xl font-bold text-center mb-6">How It Works</h3>
        <div className="flex flex-col gap-8 md:flex-row items-center ">
          <div className="flex-1 relative w-[400px] h-[260px]">
            <Image
              // src="https://via.placeholder.com/400"
              src="/chatbot.png"
              alt="Illustration"
              fill
            />
          </div>
          <div className="flex-1">
            <ol className="list-decimal list-inside space-y-4 ">
              <li>
                <span className="font-semibold">Ask a Question:</span> Speak or type your board game
                rule query.
              </li>
              <li>
                <span className="font-semibold">Get Instant Answers:</span> The AI provides
                accurate, to-the-point explanations.
              </li>
              <li>
                <span className="font-semibold">Continue Playing:</span> No interruptions, just
                smooth gameplay.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
