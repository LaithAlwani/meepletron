import { FaBoltLightning, FaBullseye, FaHeadset } from "react-icons/fa6";

export default function Features() {
  return (
    <section id="features" className="max-w-4xl mx-auto py-12">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-6">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            icon={<FaBoltLightning size={64} />}
            header="Instant"
            text1="Ask questions"
            text2="Get instant  clarification."
            text3="Stay immersed in the game."
          />
          <Card
            icon={<FaBullseye size={64} />}
            header="Accurate"
            text1="Powered by advanced AI."
            text2="Trained on official rulebooks"
            text3="Made by humans."
          />

          <Card
            icon={<FaHeadset size={64} />}
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
    <div className=" bg-white dark:bg-indigo-600 shadow-lg  w-60 h-72 mx-auto p-6">
      <span className="block mb-4">{icon}</span>
      <h4 className="text-2xl font-bold">{header}</h4>
      <ul className="mt-4 space-y-2">
        <li>{text1}</li>
        <li>{text2}</li>
        <li>{text3}</li>
      </ul>
      {/* <p className="mt-2">{text}</p> */}
    </div>
  );
};
