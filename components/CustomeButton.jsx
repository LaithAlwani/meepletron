export default function CustomButton({ onClick, children, className = "", disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mt-6 inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700 disabled:bg-gray-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 font-bold transition duration-300 ${className}`}>
      {children}
    </button>
  );
}
