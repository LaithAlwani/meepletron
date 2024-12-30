import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <>
      <div className="text-center pt-32 relative">
        <div className="relative w-[20rem] h-[20rem] mx-auto left-5">
          <Image src="/chatbot-ed.png" fill priority alt="robot logo" />
          <span className="absolute text-left font-bold text-[10px] top-[2.1rem] right-[1.6rem] bg-gradient-to-tr from-purple-500 to-red-500 text-transparent bg-clip-text">
            Hi, I'm Jenna!
            <br />
            The Rules Guru. 
            <br/>Ready to Help!
          </span>
        </div>

        <h1 className="text-2xl uppercase font-bold pt-5 bg-gradient-to-br from-purple-500 to-red-500 text-transparent bg-clip-text">
          Rules Guru
        </h1>
        <p className="italic up text-sm pb-5">Say goodbye to rulebook flipping!</p>
        <Link
          href={"/chat"}
          className="inline-block rounded  mx-1 font-bold bg-[--btn-primary] p-3">
          Chat Now
        </Link>
        <Link
          href={"#learn"}
          className="inline-block rounded  mx-1 font-bold bg-[--btn-secondary] p-3">
          Learn More
        </Link>
      </div>
    </>
  );
}
