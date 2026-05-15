"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { Button, Input, Textarea, Card, Field } from "@/components/ui";

export default function AddBoardgame() {
  const [isLoading, setIsLoading] = useState(false);
  const [tempFileUrl, setTempFileUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [parseStep, setParseStep] = useState(null);
  const [isExpansion, setIsExpansion] = useState(false);
  const fileInputRef = useRef(null);

  // BGG auto-fill
  const [bggUrl, setBggUrl] = useState("");
  const [bggFetching, setBggFetching] = useState(false);
  const [fields, setFields] = useState({
    title: "", image: "", minPlayers: "", maxPlayers: "", playTime: "", minAge: "", year: "",
    bggId: "", parentId: "", designers: "", artists: "", publishers: "",
    categories: "", gameMechanics: "", description: "",
  });

  const setField = (name) => (e) => setFields((f) => ({ ...f, [name]: e.target.value }));

  const handleAutofill = async () => {
    const match = bggUrl.match(/boardgame(?:expansion)?\/(\d+)/);
    if (!match) return toast.error("Invalid BGG URL — expected boardgamegeek.com/boardgame/ID/…");
    setBggFetching(true);
    try {
      const res = await fetch(`/api/boardgames/bgg-fetch?id=${match[1]}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setIsExpansion(json.is_expansion);
      setFields({
        title:        json.title ?? "",
        image:        json.image ?? "",
        minPlayers:   json.min_players != null ? String(json.min_players) : "",
        maxPlayers:   json.max_players != null ? String(json.max_players) : "",
        playTime:     json.play_time   != null ? String(json.play_time)   : "",
        minAge:       json.min_age     != null ? String(json.min_age)     : "",
        year:         json.year        != null ? String(json.year)        : "",
        bggId:        json.bgg_id ?? "",
        parentId:     json.parent_bgg_id ?? "",
        designers:    (json.designers     ?? []).join("\n"),
        artists:      (json.artists       ?? []).join("\n"),
        publishers:   (json.publishers    ?? []).join("\n"),
        categories:   (json.categories    ?? []).join("\n"),
        gameMechanics:(json.game_mechanics ?? []).join("\n"),
        description:  json.description ?? "",
      });
      toast.success(`"${json.title}" loaded from BGG`);
    } catch (err) {
      toast.error(err.message || "Failed to fetch from BGG");
    } finally {
      setBggFetching(false);
    }
  };

  const newlineStringToArray = (value = "") =>
    value.split(/[\n,]+/).map((v) => v.trim()).filter(Boolean);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setTempFileUrl(null);
    setUploadedFileName(null);
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
      setUploadedFileName(selectedFile.name);
      setParseStep("done");
    } catch (err) {
      setParseStep("error");
      toast.error(err.message || "Failed to upload file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseStep !== "done") return;

    const formData = new FormData(e.currentTarget);
    const boardgame = {
      title:         formData.get("title"),
      image:         formData.get("image"),
      min_players:   Number(formData.get("minPlayers")),
      max_players:   Number(formData.get("maxPlayers")),
      play_time:     Number(formData.get("playTime")),
      min_age:       Number(formData.get("minAge")),
      year:          Number(formData.get("year")),
      is_expansion:  formData.get("isExpansion") === "yes",
      bgg_id:        formData.get("bggId"),
      parent_id:     formData.get("parentId"),
      designers:     newlineStringToArray(formData.get("designers")),
      artists:       newlineStringToArray(formData.get("artists")),
      publishers:    newlineStringToArray(formData.get("publishers")),
      categories:    newlineStringToArray(formData.get("categories")),
      game_mechanics:newlineStringToArray(formData.get("gameMechanics")),
      description:   formData.get("description"),
    };

    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardgame, tempFileUrl }),
      });
      const { data } = await res.json();
      if (res.ok) {
        toast.custom((t) => (
          <CustomToast
            message={`${data} added. Now migrate its rulebook from the Migrate tab.`}
            id={t.id}
          />
        ));
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
    { key: "done",      label: "Ready"  },
  ];
  const stepIndex = parseStep === "uploading" ? 0 : parseStep === "done" ? 1 : -1;

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/admin/boardgames" className="text-subtle hover:text-foreground transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-2xl font-bold text-foreground">Add Board Game</h1>
        </div>

        {/* BGG Auto-fill */}
        <div className="mb-4">
          <p className="text-xs text-subtle mb-1.5">Paste a BoardGameGeek URL to auto-fill the form</p>
          <div className="flex gap-2">
            <Input
              value={bggUrl}
              onChange={(e) => setBggUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAutofill(); } }}
              placeholder="https://boardgamegeek.com/boardgame/13/catan"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAutofill}
              isLoading={bggFetching}
              disabled={!bggUrl.trim() || bggFetching}
              styles="shrink-0 px-5">
              Auto-fill
            </Button>
          </div>
        </div>

        <p className="text-xs text-subtle mb-2">
          <span className="text-red-500">*</span> Required field
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card label="Game Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Title" required>
                <Input name="title" placeholder="e.g. Catan" value={fields.title} onChange={setField("title")} />
              </Field>
              <Field label="Image URL" required>
                <Input name="image" placeholder="https://..." value={fields.image} onChange={setField("image")} />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Min Players" required>
                <Input name="minPlayers" type="number" placeholder="2" value={fields.minPlayers} onChange={setField("minPlayers")} />
              </Field>
              <Field label="Max Players" required>
                <Input name="maxPlayers" type="number" placeholder="4" value={fields.maxPlayers} onChange={setField("maxPlayers")} />
              </Field>
              <Field label="Play Time (min)" required>
                <Input name="playTime" type="number" placeholder="60" value={fields.playTime} onChange={setField("playTime")} />
              </Field>
              <Field label="Min Age" required>
                <Input name="minAge" type="number" placeholder="10" value={fields.minAge} onChange={setField("minAge")} />
              </Field>
            </div>
            <Field label="Year Published" required>
              <Input name="year" type="number" placeholder="2024" value={fields.year} onChange={setField("year")} />
            </Field>
          </Card>

          <Card label="Identifiers">
            <Field label="Is Expansion?">
              <select
                name="isExpansion"
                value={isExpansion ? "yes" : "no"}
                onChange={(e) => setIsExpansion(e.target.value === "yes")}
                className="w-full px-4 py-2 border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="BGG ID" required>
                <Input name="bggId" placeholder="e.g. 13" value={fields.bggId} onChange={setField("bggId")} />
              </Field>
              {isExpansion && (
                <Field label="BGG Parent ID" required>
                  <Input name="parentId" placeholder="e.g. 13" required value={fields.parentId} onChange={setField("parentId")} />
                </Field>
              )}
              {!isExpansion && (
                <input name="parentId" type="hidden" value="null" readOnly />
              )}
            </div>
          </Card>

          <Card label="Credits">
            <p className="text-xs text-subtle">Separate entries with commas or new lines.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Designers" required>
                <Textarea name="designers" placeholder="e.g. Klaus Teuber" rows={3} value={fields.designers} onChange={setField("designers")} />
              </Field>
              <Field label="Artists" required>
                <Textarea name="artists" placeholder="e.g. Franz Vohwinkel" rows={3} value={fields.artists} onChange={setField("artists")} />
              </Field>
              <Field label="Publishers" required>
                <Textarea name="publishers" placeholder="e.g. Catan Studio" rows={3} value={fields.publishers} onChange={setField("publishers")} />
              </Field>
              <Field label="Categories" required>
                <Textarea name="categories" placeholder="e.g. Strategy, Family" rows={3} value={fields.categories} onChange={setField("categories")} />
              </Field>
            </div>
            <Field label="Game Mechanics" required>
              <Textarea name="gameMechanics" placeholder="e.g. Dice Rolling, Trading" rows={3} value={fields.gameMechanics} onChange={setField("gameMechanics")} />
            </Field>
          </Card>

          <Card label="Description">
            <Field label="Description" required>
              <Textarea name="description" placeholder="Game description..." rows={5} value={fields.description} onChange={setField("description")} />
            </Field>
          </Card>

          <Card label={<>Rulebook <span className="text-red-500">*</span></>}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parseStep === "uploading" || parseStep === "parsing"}
              className="w-full py-10 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 text-subtle hover:border-primary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">Click to upload PDF or image</span>
              <span className="text-xs opacity-60">.pdf · .jpg · .png · .webp</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />

            {parseStep && parseStep !== "error" && (
              <div className="flex items-center">
                {steps.map((step, i) => {
                  const isDone = stepIndex > i;
                  const isActive = stepIndex === i;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone ? "bg-green-500 text-white" : isActive ? "bg-primary text-primary-fg" : "bg-surface-muted text-subtle"
                        }`}>
                          {isDone ? "✓" : i + 1}
                        </div>
                        <span className={`text-xs whitespace-nowrap ${
                          isActive ? "text-primary font-medium" : isDone ? "text-green-600" : "text-subtle"
                        }`}>
                          {isActive && parseStep !== "done" ? `${step.label}...` : step.label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-4 ${stepIndex > i ? "bg-green-400" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {parseStep === "error" && (
              <p className="text-sm text-red-500 text-center py-2">Failed to upload file. Please try a different file.</p>
            )}

            {parseStep === "done" && (
              <div className="rounded-xl border border-border bg-surface-muted/40 p-3 text-xs text-muted space-y-1">
                <p className="font-medium text-foreground truncate">
                  {uploadedFileName || "Rulebook uploaded"}
                </p>
                <p>
                  After submitting, open the{" "}
                  <Link href="/admin/boardgames/migrate" className="text-primary hover:underline">
                    Migrate to v2
                  </Link>{" "}
                  tab to parse, review and commit the rulebook chunks before chat is enabled.
                </p>
              </div>
            )}
          </Card>

          <Button type="submit" disabled={parseStep !== "done"} isLoading={isLoading} styles="w-full py-3 text-base rounded-xl">
            {isLoading ? "Saving..." : "Submit Game"}
          </Button>
        </form>
      </div>
    </div>
  );
}
