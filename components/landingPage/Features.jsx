import { FaBoltLightning, FaBullseye, FaHeadset } from "react-icons/fa6";

export default function Features() {
  const size = 64
  const color = "text-slate-800 dark:text-slate-300"
  return (
    <section id="features" className="max-w-5xl mx-auto py-12">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-6">Features</h3>
        <div className="flex flex-wrap justify-center gap-8">
          <Card
            icon={<FaBoltLightning size={size} className={color}/>}
            header="Instant"
            text1="Ask questions"
            text2="Get instant  clarification."
            text3="Stay immersed in the game."
          />
          <Card
            icon={<FaBullseye size={size}className={color}/>}
            header="Accurate"
            text1="Powered by advanced AI."
            text2="Trained on official rulebooks"
            text3="Made by humans."
          />

          <Card
            icon={<FaHeadset size={size} className={color} />}
            header="Support"
            text1="A growing library."
            text2=" Classics games"
            text3=" to Modern games."
          />
        </div>
      </div>
    </section>
  );
}

const Card = ({ icon, header, text1, text2, text3 }) => {
  return (
    <div className=" bg-gray-200 dark:bg-slate-800 shadow-md shadow-gray-400 dark:shadow-slate-700 w-72 px-8 py-14">
      <span className="block mb-6">{icon}</span>
      <h4 className="text-3xl font-bold text-indigo-600 dark:text-yellow-500">{header}</h4>
      <ul className="mt-8 list-inside space-y-2 list-disc">
        <li>{text1}</li>
        <li>{text2}</li>
        <li>{text3}</li>
      </ul>
      {/* <p className="mt-2">{text}</p> */}
    </div>
  );
};
