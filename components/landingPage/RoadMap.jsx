const RoadMap = () => {
  const stops = [
    {
      title: "Prototype",
      description: "Creating the initial prototype to test key functionalities.",
      date: "Oct 2024 • Dec 2024",
      status: "complete", // Status: "complete", "ongoing", or "coming"
    },
    {
      title: "Refining Text Extraction",
      status: "ongoing", // or "complete" or "ongoing"
      date: "Jan 2025 • Feb 2025",
      description:
        "Improve the accuracy and relevancy of text extraction from PDF board game manuals for better search results.",
    },
    {
      title: "Refining AI Answers",
      description: "Enhancing the precision and accuracy of AI responses.",
      date: "Jan 2025 • Feb 2025",
      status: "ongoing",
    },
    {
      title: "Building Game Library",
      description: "Extracting information from official board game manuals.",
      date: "Mar 2025 • Jun 2025",
      status: "coming",
    },
    {
      title: "Beta Testing",
      description: "Testing the product with real users to gather feedback.",
      date: "Mar 2025 - Jun 2025",
      status: "coming",
    },
    {
      title: "Launch",
      description: "Official release of the product to the public.",
      date: "Early Q3 • 2025",
      status: "coming",
    },
    {
      title: "Favorites List",
      status: "coming", // or "complete" or "ongoing"
      date: "Late Q3 • 2025",
      description:
        "Allow users to add board games to a favorites list for quick access and easy reference.",
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
      <h2 className="text-3xl font-bold mb-8">Road Map</h2>
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
              <h3 className="text-lg font-semibold text-indigo-600 dark:text-yellow-500">
                {stop.title}
              </h3>
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

            {/* Spacer for alternating layout */}
            {/* <div className="w-1/2 px-4"></div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadMap;
