"use client";
import { upload } from "@vercel/blob/client";
import { useState, useRef } from "react";
import { useSearch } from "@/utils/hooks";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import CustomToast from "@/components/CustomeToast";
import CustomButton from "@/components/CustomeButton";
import Loader from "@/components/Loader";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [boardgame, setBoardgame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { query, setQuery, results, loading } = useSearch({limit:5});
  const inputFileRef = useRef(null);
  const [blob, setBlob] = useState(null);

  const uploadBlob = async (event, game) => {
    event.preventDefault();
    setIsLoading(true);
    const file = inputFileRef.current.files[0];
    const safeTitle = boardgame.title.replace(/\s+/g, "_").toLowerCase();

    try {
      const newBlob = await upload(`${safeTitle}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/boardgames/rule-book",
        onUploadProgress: (progressEvent) => {
          console.log(`Loaded ${progressEvent.loaded} bytes`);
          console.log(`Total ${progressEvent.total} bytes`);
          console.log(`Percentage ${progressEvent.percentage}%`);
        },
      });
      setBlob(newBlob);
      const url = {
        blob: newBlob,
        isTextExtracted: false,
      };
      const updateData = { $push: { urls: url } };
      const res = await fetch("/api/boardgames/update", {
        method: "POST",
        body: JSON.stringify({ boardgame_id: boardgame._id, updateData }),
      });
      const { data } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={data} id={t.id} />);
      } else {
        toast.err(data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl">Upload Files</h1>
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search for parent board game..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded w-full"
        />
        {loading && <p className="text-gray-500 mt-2">Loading...</p>}
        {!loading && results.length === 0 && query.trim() && (
          <p className="text-gray-400 mt-4">No results found.</p>
        )}

        <div className="flex my-4 gap-4 overflow-x-scroll">
          {results.map((game) => (
            <div key={game._id} onClick={() => setBoardgame(game)} className="cursor-pointer">
              <img src={game.thumbnail} alt={game.title} className="w-16 rounded" />
              <h2>{game.title}</h2>
            </div>
          ))}
        </div>
      </div>
      {boardgame && (
        <div className="mt-4">
          <img src={boardgame.thumbnail} alt={boardgame.title} className="w-32 rounded" />
          <p className="font-bold text-lg">{boardgame.title}</p>

          <div className="mt-6">
            {boardgame && (
              <>
                <h1>Upload Your Manual</h1>

                <form onSubmit={(e) => uploadBlob(e, boardgame)}>
                  <input name="file" ref={inputFileRef} type="file" required />
                  <button type="submit">{isLoading ? <Loader width={"1rem"} /> : "Upload"}</button>
                </form>
                {blob && (
                  <div>
                    Blob url: <a href={blob.url}>{blob.url}</a>
                    <Link className="bg-green-500 p-2 rounded-sm" href={"/admin/boardgames/extract"}> Next </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
