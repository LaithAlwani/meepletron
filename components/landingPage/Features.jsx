import { FaBoltLightning, FaBullseye, FaHeadset } from "react-icons/fa6";
import { Heading } from "../ui";

export default function Features() {
  const size = 64;
  const color = "text-slate-800 dark:text-slate-300";
  return (
    <section id="features" className="max-w-5xl mx-auto py-12">
      <div className="container mx-auto px-4">
        <Heading level={2}>Features</Heading>

        <div className="flex flex-wrap justify-center lg:justify-between gap-8">
          <Card
            icon={<FaBoltLightning size={size} className={color} />}
            header="Instant"
            text1="Get answers in seconds."
            text2="No more rulebook searching."
            text3="Keep the game flowing."
          />
          <Card
            icon={<FaBullseye size={size} className={color} />}
            header="Accurate"
            text1="Powered by advanced AI."
            text2="Based on official rulebooks."
            text3="Reliable, precise rulings."
          />

          <Card
            icon={<FaHeadset size={size} className={color} />}
            header="Support"
            text1="Expanding game library."
            text2="Request games to add."
            text3="Always growing, always improving."
          />
        </div>
      </div>
    </section>
  );
}

const Card = ({ icon, header, text1, text2, text3 }) => {
  return (
    <>
      {/* <div className=" bg-gray-200 dark:bg-slate-800 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl w-72 px-8 py-14">
        <span className="block mb-6">{icon}</span>
        <h4 className="text-3xl font-bold text-blue-600 dark:text-yellow-500">{header}</h4>
        <ul className="mt-8 list-inside">
          <li>
            <em>{text1}</em>
          </li>
          <li>{text2}</li>
          <li>{text3}</li>
        </ul>
        
      </div> */}
      <div className="bg-gray-200 dark:bg-slate-800  p-6 w-72 h-96  shadow-lg flex flex-col justify-center items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <div className="text-4xl text-yellow-400 mb-6">{icon}</div>
        <h4 className="text-3xl font-bold text-blue-600 dark:text-yellow-500 mb-6">{header}</h4>
        <em>{text1}</em>
        <em>{text2}</em>
        <em>{text3}</em>
      </div>
    </>
  );
};
