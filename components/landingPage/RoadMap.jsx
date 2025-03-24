import connectToDB from "@/utils/database";
import { Heading } from "../ui";
import Roadmap from "@/models/roadmap";
export const dynamic = 'force-dynamic'

const RoadMap = async () => {
  
  await connectToDB()
  const stops = await Roadmap.find({}).lean()


  const getStatusDot = (status) => ({
    complete: "bg-green-500",
    ongoing: "bg-yellow-500 animate-ping",
    coming: "bg-red-500",
  }[status] || "");

  return (
    <div className="flex flex-col items-center py-12">
      <Heading level={2}>Road Map 2025</Heading>
      <div className="relative w-full max-w-xl">
        {/* Vertical Line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
        {stops.map((stop, index) => (
          <div
            key={index}
            className={`flex items-center w-full ${
              index % 2 === 0 ? "flex-row-reverse pl-6" : "flex-row pr-6"
            } mb-8 `}>
            {/* Content */}
            <div className="w-1/2 text-right px-4">
              <Heading level={4}>{stop.title}</Heading>
              <p className="text-sm text-gray-600 dark:text-gray-200">{stop.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-300 font-light mt-1">
                {stop.date}
              </p>
            </div>

            {/* Circle and Line */}
            <div className="relative">
              <div
                className={`h-6 w-6 ${getStatusDot(
                  stop.status
                )} rounded-full border-4 border-white shadow-md`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadMap;


