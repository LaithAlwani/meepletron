"use client";
import CustomLink from "@/components/CustomeLink";
import Loader from "@/components/Loader";
import { Input } from "@/components/ui";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function ChatsPage() {
  const { user, isLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInput = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return chats;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return chats.filter((item) => {
      if (item.boardgame_id && item.boardgame_id.title) {
        return item.boardgame_id.title.toLowerCase().includes(lowerCaseSearchTerm);
      }
      return false; // No match if boardgame_id or title is missing
    });
  }, [chats, searchTerm]);

  const getChats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat?user_id=${user.id}`);
      const { data, message } = await res.json();
      if (!res.ok) return toast.error(message);
      setChats(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getChats();
  }, [user]);

  if (!user && isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center">
        <p className="mb-2 text-lg">Please sign in to start a chat history</p>
        <CustomLink href={"/sign-in"}>Sign in</CustomLink>
      </div>
    );
  }

  return isLoaded && !isLoading ? (
    <div className="max-w-5xl mx-auto pt-[5rem] px-4">
      <div className="max-w-lg mx-auto">
        <Input value={searchTerm} onChange={handleInput} placeholder="search" />
      </div>

      <ul className="my-6">
        {filteredData.map(({ boardgame_id }) => (
          <li key={boardgame_id._id}>
            <Link
              href={`/boardgames/${boardgame_id._id}/chat`}
              className="w-full flex justify-start items-center gap-4 mb-2 py-2 border-b">
              <div className="relative w-12 h-12 rounded">
                <Image
                  src={boardgame_id.thumbnail}
                  alt="game image"
                  fill
                  className=" object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold">{boardgame_id.title}</h3>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <div className="pt-[6rem]">
      <Loader width={"6rem"} />
    </div>
  );
}
