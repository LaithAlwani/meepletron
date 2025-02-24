"use client";
import { useState,  } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { Button, Input } from "@/components/ui";

export default function AddBoardgame() {
  const [input, setInput] = useState("");
  const [gameList, setGameList] = useState([]);
  const [boardgame, setBoardGame] = useState(null);
  const [parentGame, setParentGame] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/add", {
        method: "POST",
        body: JSON.stringify({ boardgame }),
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
        <Input name="" placeholder="title" />
        <Input name="" placeholder="image" />
        <Input name="" placeholder="thumbnail" />
        <Input name="" type="number" placeholder="max players" />
        <Input name="" type="number" placeholder="min players" />
        <Input name="" type="number" placeholder="play time" />
        <Input name="" type="number" placeholder="min age" />

        <Button>Submit</Button>
      </form>
    </section>
  );
}
