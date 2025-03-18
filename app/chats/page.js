"use client";
import CustomLink from "@/components/CustomeLink";
import CustomToast from "@/components/CustomeToast";
import Loader from "@/components/Loader";
import { Input } from "@/components/ui";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";

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

  const deleteChat = async (chat_id, boardgame_id) => {
    const res = await fetch("/api/chat/delete", {
      method: "POST",
      body: JSON.stringify({ chat_id, boardgame_id }),
    });
    const { message } = await res.json();
    if (!res.ok) return toast.error(message);
    toast.custom((t) => <CustomToast message={message} id={t.id} />);
    setChats(chats.filter((chat) => chat._id != chat_id));
  };

  useEffect(() => {
    getChats();
  }, [user]);

  if (!user && isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center">
        <p className="mb-2 text-lg">Please sign in to start a chat history</p>
        <SignInButton className="min-w-32 text-center inline-block  bg-blue-600 text-white py-3 px-6 shadow-sm hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 font-bold transition duration-300" />
      </div>
    );
  }

  return isLoaded && !isLoading ? (
    <div className="max-w-2xl mx-auto pt-[5rem] px-4">
      {chats.length > 0 ? (
        <>
          <div className="max-w-lg mx-auto">
            <Input value={searchTerm} onChange={handleInput} placeholder="search chats" />
          </div>
          <ul className="my-6">
            {filteredData.map(({ _id, boardgame_id }) => (
              <li
                key={_id}
                className="w-full flex justify-between items-end gap-4 mb-2 py-2 border-b">
                <Link
                  href={`/boardgames/${boardgame_id._id}/chat`}
                  className="w-[80%] flex items-end gap-4">
                  <div className="relative flex-shrink-0 w-12 h-12 rounded">
                    <img
                      src={boardgame_id.thumbnail}
                      alt={boardgame_id.title}
                      fill
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="capitalize font-semibold overflow-x-hidden text-ellipsis text-nowrap">
                    {boardgame_id.title}
                  </h3>
                </Link>
                <span className="flex-shrink-0" onClick={() => deleteChat(_id, boardgame_id._id)}>
                  <MdDelete size={24} color="red" />
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center pt-20">
          <h2 className="text-lg font-semibold">No Chats Available</h2>
          <CustomLink href={"/boardgames"}>Go to Board Games</CustomLink>
        </div>
      )}
    </div>
  ) : (
    <div className="pt-[6rem]">
      <Loader width={"6rem"} />
    </div>
  );
}
