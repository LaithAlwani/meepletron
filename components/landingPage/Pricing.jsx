import Link from "next/link";
import React from "react";

export default function Pricing() {
  return (
    <section id="pricing" className="py-12 max-w-4xl mx-auto">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-3xl font-bold mb-6">Pricing</h3>
        <div className=" grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card type="Beta Testing" price="Free" />
          <Card type="Monthly" price="2.99/month" />
          <Card type="Annually" price="29.99/year" />
        </div>
      </div>
    </section>
  );
}

const Card = ({ type, price }) => {
  return (
    <div className="flex flex-col justify-center gap-8 mx-auto w-60 h-72 bg-white dark:bg-indigo-600 shadow-md p-6">
      <h4 className="text-xl font-semibold">{type}</h4>
      <p className="mt-4 text-2xl font-bold">{price}</p>
      <Link
        href="#get-started"
        className="block mt-4 font-semibold bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-200 dark:hover:bg-indigo-300 dark:text-gray-800 shadow-lg text-white py-2 px-4 rounded-lg ">
        Choose Plan
      </Link>
    </div>
  );
};
