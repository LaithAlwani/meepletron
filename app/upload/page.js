"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [fileText, setText] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.set("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: data,
    });
    if (res.ok) {
      const data = await res.json();
      setText(data.data);
    }
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        <button>upload</button>
      </form>
      
      {fileText.map((text, idx) => <pre key={idx} className="w-full">{text.pageContent}</pre>)}
    </div>
  );
}
