import Link from "next/link";
export default function Home() {
  return (
    <>
      <div>
        <h1>Welcome To Board Game Rules . AI </h1>
        <Link href={"/chat"}>Chat Now!</Link>
      </div>
    </>
  );
}
