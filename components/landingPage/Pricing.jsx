"use client";
import Link from "next/link";
import { useState } from "react";
import { FaCheck } from "react-icons/fa6";
import CustomLink from "../CustomeLink";

export default function Pricing() {
  const [isMonthly, setIsMonthly] = useState(true);
  const handleClick = (value) => {
    setIsMonthly(value === "month");
  };

  return (
    <section id="pricing" className="py-12 max-w-xl mx-auto">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl text-center font-bold mb-6">Pricing</h3>

        <div className=" flex flex-col justify-start gap-8 mx-auto w-72 bg-gray-200 dark:bg-slate-800 shadow-md shadow-gray-400 dark:shadow-slate-700 h-[22rem]">
          <div className="flex justify-between items-center  ">
            {/* <PeriodTab isMonthly={isMonthly} label="monthly" onClick={handleClick} value="month" /> */}
            {/* <PeriodTab isMonthly={!isMonthly} label="annually" onClick={handleClick} value="year" /> */}
          </div>
          {isMonthly ? <Card type="Monthly" price="Free" /> : <Card type="Annually" price="Free" />}
        </div>
      </div>
    </section>
  );
}

const PeriodTab = ({ label, onClick, value, isMonthly }) => (
  <span
    className={`
      ${
        isMonthly
          ? "font-semibold text-lg shadow-sm shadow-gray-300 dark:shadow-slate-600"
          : "text-sm"
      } text-center flex-1 p-4 underline`}
    onClick={() => onClick(value)}>
    {label}
  </span>
);

const Card = ({ type, price }) => {
  const color = "text-green-500 ";
  const size = 14;

  return (
    <div className="p-4 flex flex-col justify-between h-full ">
      <div>
        <h4 className="text-3xl font-bold border-b border-gray-400 pb-2">
          {price}
          <span className="text-xs font-light text-slate-500 dark:text-slate-400">
            {/* {type === "Monthly" ? " /mo." : type === "Annually" ? " /yr." : " "} */}/ Until Beta
            Ends
          </span>
        </h4>

        <ul className="my-4 space-y-2">
          <li className="flex items-center gap-2">
            <FaCheck size={size} className={color} /> Access Game Library
          </li>
          {/* <li className="flex items-center gap-2">
            <FaCheck size={size} className={color} /> Chat history
          </li> */}

          {/* {type === "Annually" && (
            <li className="flex items-center gap-2">
              <FaCheck size={size} className={color} />
              Best value
            </li>
          )} */}
        </ul>
      </div>
      <CustomLink href="boardgames">Choose Plan</CustomLink>
    </div>
  );
};

// const PeriodTab = ({ label, onClick, value, isMonthly }) => (
//   <span
//     className={`
//       ${
//       isMonthly
//         ? "font-semibold text-lg shadow-sm shadow-gray-300 dark:shadow-slate-600"
//         : "text-sm"
//     } text-center flex-1 p-4 underline`}
//     onClick={() => onClick(value)}>
//     {label}
//   </span>
// );
