import Link from "next/link";

export default function CustomLink({ href, children, className = "" }) {
  return (
    <Link
      href={href}
      className={`mt-6 mx-auto inline-block bg-blue-600 text-white py-3 px-6 rounded-lg shadow hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 font-bold transition duration-300 ${className}`}>
      {children}
    </Link>
  );
}
