'use client'
import { useUser } from "@clerk/nextjs";


export default function WelcomeMessage() {
  const { user } = useUser();
  return (
    <span
      className={`absolute text-left font-bold ${
        user
          ? "text-[18px] right-[1.5rem] top-[2.4rem] sm:top-[2.8rem]"
          : "text-[10px] right-[1rem] top-[2.2rem] sm:top-[2.5rem]"
      }  
            bg-gradient-to-tr from-purple-500 to-red-500 text-transparent bg-clip-text`}>
      {user ? (
        <span>Hi {user.firstName}!</span>
      ) : (
        <span>
          Hi, I'm Meepletron!
          <br />
          How can I help?!
        </span>
      )}
    </span>
  );
}
