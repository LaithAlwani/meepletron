"use client";
import CustomButton from "@/components/CustomeButton";
import CustomLink from "@/components/CustomeLink";
import Loader from "@/components/Loader";
import { useSearch } from "@/utils/hooks";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { upload } from "@vercel/blob/client";
import CustomToast from "@/components/CustomeToast";

export default function BoardgameEditPage() {
  const { query, setQuery, results, loading } = useSearch({ limit: 5 });
  const [boardgame, setBoardgame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileText, setFileText] = useState([]);
  const [file, setFile] = useState(null);

  const restSelection = () => {
    setBoardgame(null);
    setIsLoading(false);
    setFileText([]);
    setFile(null);
  };

  const extractText = async () => {
    setIsLoading(true);
    const data = file.blob.url;
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

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!boardgame || !fileText.length) return toast.error("Please add game and rules");
    try {
      const res = await fetch("/api/boardgames/embeddings", {
        method: "POST",
        body: JSON.stringify({ fileText, boardgame, blob: file }),
      });
      const { data, message } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${message} updated successfully!`} id={t.id} />);
        // router.push("/admin/boardgames/add");
        setBoardgame(data);
        setFileText([]);
        setFile(null);
      } else {
        toast.error(message || "Something went wrong");
      }
    } catch (err) {
      console.log(err);
      toast.error(err.message || "Server error, please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-2">
      {!boardgame && (
        <div className="">
          <h2>Choose boardgame</h2>
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
            <div className=" w-full bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-800 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
              {results.map((boardgame) => (
                <div
                  key={boardgame._id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                  <div
                    className="flex items-center gap-3 w-full"
                    onClick={() => setBoardgame(boardgame)}>
                    <img
                      src={boardgame.thumbnail}
                      alt={boardgame.title}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <span className="capitalize font-semibold text-sm  ">{boardgame.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {boardgame && (
        <div>
          <div className="relative flex py-5 items-center ">
            <div className="w-[3rem] border-t border-gray-400 dark:border-yellow-300"></div>
            <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Selected Game</h2>
            <div className="flex-grow border-t border-gray-400 dark:border-yellow-300"></div>
          </div>
          <div className="flex justify-between">
            <div>
              <img src={boardgame.thumbnail} alt="" />
              <h3>{boardgame.title}</h3>
            </div>
            <CustomButton className="bg-red-500 hover:bg-red-600" onClick={restSelection}>
              Remove Game
            </CustomButton>
          </div>
          {/* upload files */}
          {boardgame && <UploadFiles boardgame={boardgame} setBoardgame={setBoardgame} />}
          {boardgame.urls.length > 0 && (
            <>
              <div className="relative flex py-5 items-center ">
                <div className="w-[3rem] border-t border-gray-400 dark:border-yellow-300"></div>
                <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Files</h2>
                <div className="flex-grow border-t border-gray-400 dark:border-yellow-300"></div>
              </div>
              <ul>
                {boardgame.urls.map((url) => (
                  <li
                    key={url?.blob?.url}
                    className="flex items-center justify-between p-4 border-b border-gray-400 dark:border-yellow-500">
                    {url.blob.contentDisposition.match(/filename="(.+?)\.pdf"/)[1]}
                    <CustomButton disabled={url.isTextExtracted} onClick={() => setFile(url)}>
                      {!url.isTextExtracted ? "Extract" : "Extracted"}
                    </CustomButton>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {boardgame && file && (
        <CustomButton
          onClick={extractText}
          disabled={isLoading}
          className="mt-2 bg-blue-600 dark:bg-yellow-500 px-4 py-2 rounded text-white w-full">
          {isLoading ? <Loader width="1rem" /> : "Extract Text"}
        </CustomButton>
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
            onClick={() => setBoardgame(null)}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 py-2 rounded w-full disabled:bg-red-300">
            Reject
          </button>
        </div>
      )}
    </section>
  );
}

const UploadFiles = ({ boardgame, setBoardgame }) => {
  const inputFileRef = useRef(null);
  const [blob, setBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const uploadBlob = async (e) => {
    e.preventDefault();
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
      const { data, message } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={message} id={t.id} />);
        setBoardgame(data);
      } else {
        toast.err(message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    boardgame && (
      <>
        <div className="relative flex py-5 items-center ">
          <div className="w-[3rem] border-t border-gray-400 dark:border-yellow-300"></div>
          <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Upload Files</h2>
          <div className="flex-grow border-t border-gray-400 dark:border-yellow-300"></div>
        </div>
        <form onSubmit={uploadBlob} className="flex justify-between items-center">
          <input name="file" ref={inputFileRef} type="file" required />
          <CustomButton type="submit">
            {isLoading ? <Loader width={"1rem"} /> : "Upload"}
          </CustomButton>
        </form>
      </>
    )
  );
};
