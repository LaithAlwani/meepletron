"use client";

import { upload } from "@vercel/blob/client";
import { useState, useRef } from "react";

export default function AvatarUploadPage() {
  const inputFileRef = useRef(null);
  const [blob, setBlob] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const file = inputFileRef.current.files[0];
    console.log(file.name, file)

    const newBlob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload/manuals",
    });

    setBlob(newBlob);
  };
  return (
    <>
      <h1>Upload Your Manual</h1>

      <form onSubmit={handleSubmit}>
        <input name="file" ref={inputFileRef} type="file" required />
        <button type="submit">Upload</button>
      </form>
      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
        </div>
      )}
    </>
  );
}
