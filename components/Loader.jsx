import React from "react";

export default function Loader({width}) {
  return <img src="/loader.svg" className="animate-spin  mx-auto" alt="loader" style={{ width, height: width }} />;
}
