"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import Loader from "@/components/Loader";
import { useSearch } from "@/utils/hooks";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { MdCloudUpload, MdOutlineDoneAll } from "react-icons/md";
import { Button, Input } from "@/components/ui";
import { motion, AnimatePresence } from "motion/react";

export default function BoardgameEditPage() {
  const { query, setQuery, results, loading } = useSearch({ limit: 5 });
  const [boardgame, setBoardgame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileText, setFileText] = useState([]);
  const [file, setFile] = useState(null);
  const [showAllChunks, setShowAllChunks] = useState(false);

  const resetSelection = () => {
    setBoardgame(null);
    setIsLoading(false);
    setFileText([]);
    setFile(null);
  };

  const extractText = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/extract", {
        method: "POST",
        body: JSON.stringify(file.path),
      });
      if (res.ok) {
        const { data } = await res.json();
        setFileText(data);
      } else {
        toast.error("URL or path missing");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmbed = async () => {
    if (!boardgame || !fileText.length) return toast.error("Please add game and rules");
    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/embeddings", {
        method: "POST",
        body: JSON.stringify({ fileText, boardgame, blob: file }),
      });
      const { data, message } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${message} updated successfully!`} id={t.id} />);
        setBoardgame(data);
        setFileText([]);
        setFile(null);
      } else {
        toast.error(message || "Something went wrong");
      }
    } catch (err) {
      toast.error(err.message || "Server error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBoardgame = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/delete", {
        method: "POST",
        body: JSON.stringify({ boardgame }),
      });
      if (!res.ok) {
        const { message } = await res.json();
        return toast.error(message);
      }
      const { data, message } = await res.json();
      setBoardgame(data);
      setQuery("");
      toast.custom((t) => <CustomToast message={message} id={t.id} />);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-slate-900 pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/admin/boardgames"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-gray-300 dark:text-slate-600">/</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Board Game</h1>
        </div>

        {/* Search / Selected Game */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-slate-700 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
            {boardgame ? "Selected Game" : "Find a Game"}
          </h2>

          {!boardgame ? (
            <div>
              <Input
                placeholder="Search board games..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {(loading || (results?.length > 0 && query.trim())) && (
                <div className="mt-2 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  {loading ? (
                    <div className="p-4 flex justify-center">
                      <Loader width="1.5rem" />
                    </div>
                  ) : (
                    results.map((game) => (
                      <button
                        key={game._id}
                        type="button"
                        onClick={() => { setBoardgame(game); setQuery(""); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b last:border-b-0 border-gray-100 dark:border-slate-700/50 transition-colors text-left">
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-sm font-medium capitalize">{game.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={boardgame.thumbnail}
                  alt={boardgame.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold capitalize truncate">{boardgame.title}</p>
                  {boardgame.bgg_id && (
                    <p className="text-xs text-gray-400 dark:text-slate-500">BGG #{boardgame.bgg_id}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="reject"
                  isLoading={isLoading}
                  onClick={deleteBoardgame}
                  styles="text-xs px-3 py-1.5">
                  Delete
                </Button>
                <button
                  type="button"
                  onClick={resetSelection}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors text-sm">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Files */}
        {boardgame && <UploadFiles boardgame={boardgame} setBoardgame={setBoardgame} />}

        {/* Existing Files List */}
        {boardgame?.urls?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-slate-700 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
              Rulebook Files
            </h2>
            <ul className="space-y-2">
              {boardgame.urls.map((url) => {
                const filename = url.path.substring(url.path.lastIndexOf("/") + 1);
                const isSelected = file?.path === url.path;
                return (
                  <li
                    key={url.path}
                    onClick={() => !url.isTextExtracted && setFile(url)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      url.isTextExtracted
                        ? "border-gray-200 dark:border-slate-700 opacity-60 cursor-default"
                        : isSelected
                        ? "border-blue-400 dark:border-yellow-500 bg-blue-50 dark:bg-yellow-500/5 cursor-pointer"
                        : "border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                    }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-gray-400 dark:text-slate-400">
                          {filename.split(".").pop().toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-slate-300 truncate">
                        {filename}
                      </span>
                    </div>
                    {url.isTextExtracted ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium shrink-0 ml-2">
                        <MdOutlineDoneAll size={14} /> Indexed
                      </span>
                    ) : (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          isSelected
                            ? "bg-blue-100 dark:bg-yellow-500/20 text-blue-600 dark:text-yellow-400"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                        }`}>
                        {isSelected ? "Selected" : "Not indexed"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Extract button */}
        {boardgame && file && !fileText.length && (
          <Button
            type="button"
            onClick={extractText}
            isLoading={isLoading}
            styles="w-full py-3 rounded-xl">
            Extract Text
          </Button>
        )}

        {/* Extracted Text Preview */}
        {fileText.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-slate-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                Extracted Content
              </h2>
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                {fileText.length} chunks
              </span>
            </div>
            <div className="space-y-2">
              {fileText.slice(0, 3).map((text, i) => (
                <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-blue-600 dark:text-yellow-400">
                      Chunk {i + 1}
                    </span>
                    {text.metadata?.loc?.pageNumber && (
                      <span className="bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                        Page {text.metadata.loc.pageNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {text.pageContent}
                  </p>
                </div>
              ))}
            </div>
            {fileText.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllChunks(true)}
                className="w-full py-2.5 text-sm text-blue-600 dark:text-yellow-400 hover:text-blue-700 dark:hover:text-yellow-300 font-medium border border-blue-200 dark:border-yellow-500/30 rounded-xl hover:bg-blue-50 dark:hover:bg-yellow-500/5 transition-all">
                View all {fileText.length} chunks →
              </button>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="accept"
                onClick={handleEmbed}
                isLoading={isLoading}
                styles="flex-1 py-2.5">
                Accept & Embed
              </Button>
              <Button
                type="button"
                variant="reject"
                onClick={() => { setFileText([]); setFile(null); }}
                disabled={isLoading}
                styles="flex-1 py-2.5">
                Reject
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* All Chunks Modal */}
      <AnimatePresence>
        {showAllChunks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAllChunks(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Extracted Content{" "}
                  <span className="text-gray-400 dark:text-slate-400 font-normal text-sm">
                    ({fileText.length} chunks)
                  </span>
                </h3>
                <button
                  onClick={() => setShowAllChunks(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors text-sm">
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {fileText.map((text, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-blue-600 dark:text-yellow-400">
                        Chunk {i + 1}
                      </span>
                      {text.metadata?.loc?.pageNumber && (
                        <span className="bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          Page {text.metadata.loc.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {text.pageContent}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadFiles({ boardgame, setBoardgame }) {
  const inputFileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const uploadBlob = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("filename", file.name);
    formData.append("filetype", file.type);
    formData.append("id", boardgame._id);

    try {
      const res = await fetch("/api/boardgames/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to get upload URL");

      const { urlData, message } = await res.json();

      const s3Res = await fetch(urlData.signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!s3Res.ok) throw new Error("Upload to S3 failed");

      toast.custom((t) => <CustomToast message={message} id={t.id} />);

      const newUrl = { path: urlData.objectUrl, isTextExtracted: false };
      const updateData = { $push: { urls: newUrl } };

      const resUpdate = await fetch("/api/boardgames/update", {
        method: "POST",
        body: JSON.stringify({
          boardgame_id: boardgame._id,
          is_expansion: boardgame.is_expansion,
          updateData,
        }),
      });
      if (resUpdate.ok) {
        const { data, message: msg } = await resUpdate.json();
        toast.custom((t) => <CustomToast message={msg} id={t.id} />);
        setFile(null);
        setBoardgame(data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-slate-700 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
        Upload New File
      </h2>
      <form onSubmit={uploadBlob} className="space-y-3">
        <button
          type="button"
          onClick={() => inputFileRef.current?.click()}
          className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-yellow-500 hover:text-blue-500 dark:hover:text-yellow-400 transition-all cursor-pointer">
          <MdCloudUpload size={28} />
          <span className="text-sm font-medium">
            {file ? file.name : "Click to choose a file"}
          </span>
          {!file && <span className="text-xs opacity-60">.pdf · .jpg · .png · .webp</span>}
        </button>
        <Input
          ref={inputFileRef}
          name="file"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          isHidden={true}
        />
        {file && (
          <Button type="submit" isLoading={isLoading} styles="w-full py-2.5">
            <span className="flex items-center justify-center gap-2">
              <MdCloudUpload size={16} /> Upload File
            </span>
          </Button>
        )}
      </form>
    </div>
  );
}
