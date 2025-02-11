import CustomLink from "@/components/CustomeLink";
import Link from "next/link";

export default function BoardgamePage() {
  return (
    <section className="max-w-xl mx-auto pt-[6rem]">
      <CustomLink href={"/admin/boardgames/add"}>Add</CustomLink>
      <CustomLink href={"/admin/boardgames/edit"}>Edit</CustomLink>
    </section>
  );
}
