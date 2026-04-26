"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { Button, Input, Textarea } from "@/components/ui";
import { motion, AnimatePresence } from "motion/react";

export default function AddBoardgame() {
  const [isLoading, setIsLoading] = useState(false);
  const [tempFileUrl, setTempFileUrl] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [parseStep, setParseStep] = useState(null); // null | 'uploading' | 'parsing' | 'done' | 'error'
  const [showAllChunks, setShowAllChunks] = useState(false);
  const [isExpansion, setIsExpansion] = useState(false);
  const fileInputRef = useRef(null);

  const newlineStringToArray = (value = "") =>
    value.split(/[\n,]+/).map((v) => v.trim()).filter(Boolean);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setChunks([]);
    setTempFileUrl(null);
    setParseStep("uploading");

    try {
      const formData = new FormData();
      formData.append("filename", selectedFile.name);
      formData.append("filetype", selectedFile.type);

      const uploadRes = await fetch("/api/boardgames/upload?temp=true", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Failed to get upload URL");
      const { urlData } = await uploadRes.json();

      const s3Res = await fetch(urlData.signedUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });
      if (!s3Res.ok) throw new Error("Failed to upload file");

      setTempFileUrl(urlData.objectUrl);
      setParseStep("parsing");

      const extractRes = await fetch("/api/boardgames/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlData.objectUrl, contentType: selectedFile.type }),
      });
      if (!extractRes.ok) throw new Error("Failed to parse file");
      const { data } = await extractRes.json();

      setChunks(data);
      setParseStep("done");
    } catch (err) {
      setParseStep("error");
      toast.error(err.message || "Failed to process file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseStep !== "done") return;

    const formData = new FormData(e.currentTarget);
    const boardgame = {
      title: formData.get("title"),
      image: formData.get("image"),
      min_players: Number(formData.get("minPlayers")),
      max_players: Number(formData.get("maxPlayers")),
      play_time: Number(formData.get("playTime")),
      min_age: Number(formData.get("minAge")),
      year: Number(formData.get("year")),
      is_expansion: formData.get("isExpansion") === "yes",
      bgg_id: formData.get("bggId"),
      parent_id: formData.get("parentId"),
      designers: newlineStringToArray(formData.get("designers")),
      artists: newlineStringToArray(formData.get("artists")),
      publishers: newlineStringToArray(formData.get("publishers")),
      categories: newlineStringToArray(formData.get("categories")),
      game_mechanics: newlineStringToArray(formData.get("gameMechanics")),
      description: formData.get("description"),
    };

    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardgame, chunks, tempFileUrl }),
      });
      const { data } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${data} added successfully`} id={t.id} />);
      } else {
        toast.error(data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { key: "uploading", label: "Upload" },
    { key: "parsing", label: "Parse" },
    { key: "done", label: "Ready" },
  ];
  const stepIndex =
    parseStep === "uploading" ? 0 : parseStep === "parsing" ? 1 : parseStep === "done" ? 2 : -1;

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-slate-900 pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/admin/boardgames"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-gray-300 dark:text-slate-600">/</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Board Game</h1>
        </div>

        <p className="text-xs text-gray-400 dark:text-slate-500 -mt-2 mb-2">
          <span className="text-red-500">*</span> Required field
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Info */}
          <Card label="Game Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Title" required><Input name="title" placeholder="e.g. Catan" /></Field>
              <Field label="Image URL" required><Input name="image" placeholder="https://..." /></Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Min Players" required><Input name="minPlayers" type="number" placeholder="2" /></Field>
              <Field label="Max Players" required><Input name="maxPlayers" type="number" placeholder="4" /></Field>
              <Field label="Play Time (min)" required><Input name="playTime" type="number" placeholder="60" /></Field>
              <Field label="Min Age" required><Input name="minAge" type="number" placeholder="10" /></Field>
            </div>
            <Field label="Year Published" required>
              <Input name="year" type="number" placeholder="2024" />
            </Field>
          </Card>

          {/* Identifiers */}
          <Card label="Identifiers">
            <Field label="Is Expansion?">
              <select
                name="isExpansion"
                defaultValue="no"
                onChange={(e) => setIsExpansion(e.target.value === "yes")}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 rounded-lg">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="BGG ID" required>
                <Input name="bggId" placeholder="e.g. 13" />
              </Field>
              {isExpansion && (
                <Field label="BGG Parent ID" required>
                  <input
                    name="parentId"
                    placeholder="e.g. 13"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 text-gray-900 dark:text-white dark:bg-slate-700 rounded-lg"
                    required
                  />
                </Field>
              )}
              {!isExpansion && (
                <input name="parentId" type="hidden" value="null" readOnly />
              )}
            </div>
          </Card>

          {/* Credits */}
          <Card label="Credits">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Separate entries with commas or new lines.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Designers" required><Textarea name="designers" placeholder="e.g. Klaus Teuber, Bruno Faidutti" rows={3} /></Field>
              <Field label="Artists" required><Textarea name="artists" placeholder="e.g. Franz Vohwinkel" rows={3} /></Field>
              <Field label="Publishers" required><Textarea name="publishers" placeholder="e.g. Catan Studio, Asmodee" rows={3} /></Field>
              <Field label="Categories" required><Textarea name="categories" placeholder="e.g. Strategy, Family" rows={3} /></Field>
            </div>
            <Field label="Game Mechanics" required>
              <Textarea name="gameMechanics" placeholder="e.g. Dice Rolling, Trading, Hand Management" rows={3} />
            </Field>
          </Card>

          {/* Description */}
          <Card label="Description">
            <Field label="Description" required>
              <Textarea name="description" placeholder="Game description..." rows={5} />
            </Field>
          </Card>

          {/* Rulebook Upload */}
          <Card label={<>Rulebook <span className="text-red-500">*</span></>}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parseStep === "uploading" || parseStep === "parsing"}
              className="w-full py-10 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-yellow-500 hover:text-blue-500 dark:hover:text-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-medium">Click to upload PDF or image</span>
              <span className="text-xs opacity-60">.pdf · .jpg · .png · .webp</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Progress steps */}
            {parseStep && parseStep !== "error" && (
              <div className="flex items-center">
                {steps.map((step, i) => {
                  const isDone = stepIndex > i;
                  const isActive = stepIndex === i;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? "bg-green-500 text-white"
                              : isActive
                              ? "bg-blue-500 dark:bg-yellow-500 text-white"
                              : "bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-slate-400"
                          }`}>
                          {isDone ? "✓" : i + 1}
                        </div>
                        <span
                          className={`text-xs whitespace-nowrap ${
                            isActive
                              ? "text-blue-600 dark:text-yellow-400 font-medium"
                              : isDone
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}>
                          {isActive && parseStep !== "done" ? `${step.label}...` : step.label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`flex-1 h-px mx-2 mb-4 ${
                            stepIndex > i
                              ? "bg-green-400"
                              : "bg-gray-200 dark:bg-slate-600"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {parseStep === "error" && (
              <p className="text-sm text-red-500 text-center py-2">
                Failed to process file. Please try a different file.
              </p>
            )}

            {/* Chunk preview */}
            {parseStep === "done" && chunks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    Extracted Content
                  </span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    {chunks.length} chunks
                  </span>
                </div>
                <div className="space-y-2">
                  {chunks.slice(0, 3).map((chunk, i) => (
                    <ChunkCard key={i} chunk={chunk} index={i} />
                  ))}
                </div>
                {chunks.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllChunks(true)}
                    className="w-full py-2.5 text-sm text-blue-600 dark:text-yellow-400 hover:text-blue-700 dark:hover:text-yellow-300 font-medium border border-blue-200 dark:border-yellow-500/30 rounded-xl hover:bg-blue-50 dark:hover:bg-yellow-500/5 transition-all">
                    View all {chunks.length} chunks →
                  </button>
                )}
              </div>
            )}
          </Card>

          <Button
            type="submit"
            disabled={parseStep !== "done"}
            isLoading={isLoading}
            styles="w-full py-3 text-base rounded-xl">
            {isLoading ? "Saving..." : "Submit Game"}
          </Button>
        </form>
      </div>

      {/* All Chunks Modal */}
      <AnimatePresence>
        {showAllChunks && (
          <ChunksModal chunks={chunks} onClose={() => setShowAllChunks(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ label, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-slate-700 p-5 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
        {label}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ChunkCard({ chunk, index }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-semibold text-blue-600 dark:text-yellow-400">
          Chunk {index + 1}
        </span>
        {chunk.metadata?.loc?.pageNumber && (
          <span className="bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs">
            Page {chunk.metadata.loc.pageNumber}
          </span>
        )}
      </div>
      <p className="text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
        {chunk.pageContent}
      </p>
    </div>
  );
}

function ChunksModal({ chunks, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}>
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
              ({chunks.length} chunks)
            </span>
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors text-sm">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {chunks.map((chunk, i) => (
            <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-semibold text-blue-600 dark:text-yellow-400">
                  Chunk {i + 1}
                </span>
                {chunk.metadata?.loc?.pageNumber && (
                  <span className="bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    Page {chunk.metadata.loc.pageNumber}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {chunk.pageContent}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
