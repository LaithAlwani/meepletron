"use client";

import { useState, useRef } from "react";
import { useSearch } from "@/utils/hooks";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import CustomToast from "@/components/CustomeToast";
import Loader from "@/components/Loader";

export default function ExtractTextPage() {
  const router = useRouter();
  const [boardgame, setBoardgame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileText, setFileText] = useState([]);
  const { query, setQuery, results, loading } = useSearch("/api/search");
  const [blob, setBlob] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!boardgame || !fileText.length) return toast.error("Please add game and rules");
    try {
      

      const res = await fetch("/api/boardgames/embeddings", {
        method: "POST",
        body: JSON.stringify({ fileText, boardgame, blob }),
      });
      const { data } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${data} updated successfully!`} id={t.id} />);
        router.push("/boardgames");
      } else {
        toast.error(data || "Something went wrong");
      }
    } catch (err) {
      console.log(err);
      toast.error(err.message || "Server error, please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const extractText = async () => {
    setIsLoading(true)
    const data = blob.blob.url;
    try {
      const res = await fetch("/api/boardgames/extract", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { data } = await res.json();
        setFileText(data);
      } else {
        toast.error("url or path missing");
      }
    } catch (err) {
      toast.err(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl">Extract File Text</h1>
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

      {/* Selected Board Game */}
      {boardgame && (
        <div className="mt-4">
          <h3>Selected Game</h3>
          <img src={boardgame.thumbnail} alt={boardgame.title} className="w-32 rounded" />
          <p className="font-bold text-lg">{boardgame.title}</p>
        </div>
      )}
      {boardgame && boardgame.urls.length > 0 && (
        <ul>
          {boardgame.urls
            ?.filter((url) => !url?.isTextExtracted)
            .map((url) => (
              <li key={url?.blob?.url} onClick={() => setBlob(url)}>
                {url.blob.contentDisposition.match(/filename="(.+?)\.pdf"/)[1]}
              </li>
            ))}
        </ul>
      )}

      {/* File Upload for Manual */}
      {boardgame && blob && (
        <button
          onClick={extractText}
          disabled={isLoading}
          className="mt-2 bg-indigo-600 dark:bg-yellow-500 px-4 py-2 rounded text-white w-full">
          {isLoading ? <Loader width="1rem" /> : "Extract Text"}
        </button>
      )}

      {/* Display Extracted Manual Text */}
      {fileText.length > 0 && (
        <div className="mt-6">
          {fileText.map((text, idx) => (
            <pre
              key={idx}
              className="max-w-xl text-wrap border p-2 rounded bg-gray-300 dark:bg-slate-950">
              <details>
                <summary className="text-lg font-bold">Page {text.metadata.loc.pageNumber}</summary>
                {text.pageContent}
              </details>
            </pre>
          ))}
        </div>
      )}

      {/* Accept / Reject Buttons */}
      {boardgame && fileText.length > 0 && (
        <div className="flex mt-4 gap-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-green-500 disabled:bg-green-300 text-white px-4 py-2 rounded w-full">
            {isLoading ? <Loader width="1rem" /> : "Accept"}
          </button>
          <button
            onClick={() => setBoardGame(null)}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 py-2 rounded w-full disabled:bg-red-300">
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
