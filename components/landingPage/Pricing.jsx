"use client";
import Link from "next/link";
import { useState } from "react";
import { FaCheck } from "react-icons/fa6";

export default function Pricing() {
  const [isMonthly, setIsMonthly] = useState(true);
  const handleClick = (value) => {
    value === "month" ? setIsMonthly(true) : setIsMonthly(false);
    
  };
  return (
    <section id="pricing" className="py-12 max-w-4xl mx-auto">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl text-center font-bold mb-6">Pricing</h3>

        <div className="flex flex-col justify-start gap-8 mx-auto w-64 bg-white dark:bg-indigo-600 shadow-md h-[22rem]">
          <div className="flex justify-between items-center  ">
            <span className={`${isMonthly ? "font-bold " : "text-sm drop-shadow-2xl border-b border-r border-gray-700"} text-center flex-1 p-5 underline`} onClick={()=>handleClick("month")}>
              Monthly
            </span>
            <span className={`${!isMonthly ? "font-bold " : "text-sm drop-shadow-2xl border-b border-l border-gray-700"} text-center flex-1 p-5 underline`} onClick={()=>handleClick("year")}>
              Annually
            </span>
          </div>
          {isMonthly ? (
            <Card type="Monthly" price="2.99" />
          ) : (
            <Card type="Annually" price="29.99" />
          )}
        </div>
      </div>
    </section>
  );
}

const Card = ({ type, price }) => {
  const color = "green";
  const size = 14;
  return (
    <div className="px-4 pb-8 flex flex-col justify-between h-full">
      <div>
        <h4 className="text-3xl font-bold border-b border-gray-400 pb-2">
          ${price}
          <span className="text-sm font-light text-gray-400 ">
            {type === "Monthly" ? "/mo." : type === "Annually" ? "/yr." : " "}
          </span>
        </h4>

        <ul className="my-4 space-y-4">
          <li className="flex items-center gap-2">
            <FaCheck size={size} color={color} /> Access Game Library
          </li>
          <li className="flex items-center gap-2">
            <FaCheck size={size} color={color} /> Chat history
          </li>
          
          {type === "Annually" && <li className="flex items-center gap-2">
            <FaCheck size={size} color={color} />
            Best value
          </li>}
        </ul>
      </div>
      <Link
        href="#get-started"
        className="block text-center font-semibold bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-200 dark:hover:bg-indigo-300 dark:text-gray-800 shadow-lg text-white py-2 px-4 rounded-lg ">
        Choose Plan
      </Link>
    </div>
  );
};
