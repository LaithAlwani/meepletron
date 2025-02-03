import React from "react";

export default function Loader({ width, height = "auto" }) {
  return (
    <div className={`${height} flex justify-center items-center`}>
      <img
        src="/loader.svg"
        className="animate-spin mx-auto"
        alt="loader"
        style={{ width, height: width }}
      />
    </div>
  );
}
