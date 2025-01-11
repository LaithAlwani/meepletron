import Link from "next/link";
import { FaCheck } from "react-icons/fa6";

export default function Pricing() {
  return (
    <section id="pricing" className="py-12 max-w-4xl mx-auto">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl text-center font-bold mb-6">Pricing</h3>
        <div className=" grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card type="Beta" price="Free" />
          <Card type="Monthly" price="2.99" />
          <Card type="Annually" price="29.99" />
        </div>
      </div>
    </section>
  );
}

const Card = ({ type, price }) => {
  const color="green";
  const size=16;
  return (
    <div className="flex flex-col justify-between gap-8 mx-auto w-64 bg-white dark:bg-indigo-600 shadow-md p-6">
      <div>
        <h4 className="text-md font-semibold text-gray-400 ">{type}</h4>
        <p className=" text-4xl font-bold">
          ${price}
          <span className="text-sm font-light">
            {type === "Monthly" ? "/mo." : type === "Annually" ? "/yr." : " "}
          </span>
        </p>
        <hr />
        <ul className="mt-4 space-y-1">
          <li className="flex items-center gap-2">
            <FaCheck size={size} color={color} /> Access Game Library
          </li>
          <li className="flex items-center gap-2">
            <FaCheck size={size} color={color} /> Chat history
          </li>
          <li className="flex items-center gap-2">
            <FaCheck size={size} color={color} /> Lorem Ipsim
          </li>
          <li className="flex items-center gap-2">
            <FaCheck size={size} color={color} />{type === "Monthly" ? "":"Best vlaue"} Lorem Ipsim
          </li>
        </ul>
      </div>
      <Link
        href="#get-started"
        className="block mt-4 text-center font-semibold bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-200 dark:hover:bg-indigo-300 dark:text-gray-800 shadow-lg text-white py-2 px-4 rounded-lg "
      >
        Choose Plan
      </Link>
    </div>
  );
};
