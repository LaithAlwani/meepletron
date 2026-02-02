"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { Button, Input } from "@/components/ui";

export default function AddBoardgame() {
  const [input, setInput] = useState("");
  const [gameList, setGameList] = useState([]);
  const [parentGame, setParentGame] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [boardgame, setBoardgame] = useState({
    title: "",
    image: "",
    minPlayers: 0,
    maxPlayers: 0,
    playTime: 0,
    minAge: 0,
    year: 0,
    isExpansion: false,
    bggId: "",
    designers: [],
    artists: [],
    publishers: [],
    categories: [],
    gameMechanics: [],
    description: "",
  });

  const commaStringToArray = (value = "") => {
  return value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean)
}

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget)
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

    designers: commaStringToArray(formData.get("designers")),
    artists: commaStringToArray(formData.get("artists")),
    publishers: commaStringToArray(formData.get("publishers")),
    categories: commaStringToArray(formData.get("categories")),
    game_mechanics: commaStringToArray(formData.get("gameMechanics")),

    description: formData.get("description"),
    }
    console.log(boardgame);
    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/add", {
        method: "POST",
        body: JSON.stringify({boardgame}),
      });
      const { data } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${data}`} id={t.id} />);
        // router.push("/admin/boardgames/upload");
      } else {
        toast.error(data);
        setBoardGame(null);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section className="max-w-xl mx-auto pt-[6rem]">
      <h1 className="text-xl">Add Boardgame</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="title" placeholder="Title" />
        <Input name="image" placeholder="Image URL" />
        <Input name="minPlayers" type="number" placeholder="Min players" />
        <Input name="maxPlayers" type="number" placeholder="Max players" />
        <Input name="playTime" type="number" placeholder="Play time" />
        <Input name="minAge" type="number" placeholder="Min age" />
        <Input name="year" type="number" placeholder="Year" />

        <label>Is Expansion?</label>
        <select name="isExpansion" className="w-full p-2" defaultValue="no">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>

        <Input name="bggId" placeholder="BGG ID" />
        <Input name="designers" placeholder="Designers (comma separated)" />
        <Input name="artists" placeholder="Artists (comma separated)" />

        <textarea
          name="publishers"
          placeholder="Publishers (comma separated)"
          className="w-full p-2"
        />

        <Input name="categories" placeholder="Categories (comma separated)" />
        <Input name="gameMechanics" placeholder="Game mechanics (comma separated)" />

        <textarea name="description" placeholder="Description" className="w-full p-2 resize-none" />

        <Button type="submit">Submit</Button>
      </form>
    </section>
  );
}
