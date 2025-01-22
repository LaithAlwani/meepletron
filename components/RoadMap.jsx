
const RoadMap = () => {
  const stops = [
    {
      title: "Gathering Data",
      description: "Collecting and organizing relevant information for the project.",
      date: "Dec 2024 - Feb 2025",
    },
    {
      title: "Refining AI Answers",
      description: "Enhancing the precision and accuracy of AI responses.",
      date: "Jan 2025 - Feb 2025",
    },
    {
      title: "Beta Testing",
      description: "Testing the product with real users to gather feedback.",
      date: "March 2025",
    },
    {
      title: "Launch",
      description: "Official release of the product to the public.",
      date: "June 2025",
    },
  ];

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
              index % 2 === 0 ? "flex-row-reverse" : "flex-row"
            } mb-8`}
          >
            {/* Content */}
            <div className="w-1/2 text-right px-4">
              <h3 className="text-lg font-semibold text-gray-700">{stop.title}</h3>
              <p className="text-sm text-gray-600">{stop.description}</p>
              <p className="text-sm text-gray-500 font-light mt-1">{stop.date}</p>
            </div>

            {/* Circle and Line */}
            <div className="relative">
              <div className="h-6 w-6 bg-blue-500 rounded-full border-4 border-white shadow-md"></div>
              {index < stops.length - 1 && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gray-300"></div>
              )}
            </div>

            {/* Spacer for alternating layout */}
            <div className="w-1/2 px-4"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadMap;
