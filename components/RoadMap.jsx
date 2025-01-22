const RoadMap = () => {
  const stops = [
    {
      title: "Prototype",
      description: "Creating the initial prototype to test key functionalities.",
      date: "Oct 2024 - Dec 2024",
      status: "complete", // Status: "complete", "ongoing", or "coming"
    },
    {
      title: "Gathering Data",
      description: "Collecting and organizing relevant information for the project.",
      date: "Dec 2024 - Feb 2025",
      status: "ongoing",
    },
    {
      title: "Refining AI Answers",
      description: "Enhancing the precision and accuracy of AI responses.",
      date: "Jan 2025 - Feb 2025",
      status: "coming",
    },
    {
      title: "Beta Testing",
      description: "Testing the product with real users to gather feedback.",
      date: "March 2025",
      status: "coming",
    },
    {
      title: "Launch",
      description: "Official release of the product to the public.",
      date: "June 2025",
      status: "coming",
    },
  ];

  const getStatusDot = (status) => {
    if (status === "complete") {
      return "bg-green-500";
    }
    if (status === "ongoing") {
      return "bg-yellow-500 animate-ping";
    }
    if (status === "coming") {
      return "bg-red-500";
    }
  };

  return (
    <div className="flex flex-col items-center py-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Road Map</h2>
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
              <h3 className="text-lg font-semibold text-gray-700">{stop.title}</h3>
              <p className="text-sm text-gray-600">{stop.description}</p>
              <p className="text-sm text-gray-500 font-light mt-1">{stop.date}</p>
            </div>

            {/* Circle and Line */}
            <div className="relative">
              <div
                className={`h-6 w-6 ${getStatusDot(
                  stop.status
                )} rounded-full border-4 border-white shadow-md`}></div>
            </div>

            {/* Spacer for alternating layout */}
            {/* <div className="w-1/2 px-4"></div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadMap;
