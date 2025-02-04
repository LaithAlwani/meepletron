import CustomLink from "@/components/CustomeLink";
import Link from "next/link";

export default function BoardgamePage() {
  return (
    <section className="max-w-xl mx-auto">
      <CustomLink href={"/admin/boardgames/add"}>Add</CustomLink>
      <CustomLink href={"/admin/boardgames/upload"}>Upload</CustomLink>
      <CustomLink href={"/admin/boardgames/extract"}>Extract</CustomLink>
    </section>
  );
}
