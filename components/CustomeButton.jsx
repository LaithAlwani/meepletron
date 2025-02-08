export default function CustomButton({ onClick, children, className = "", disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={` inline-block bg-blue-600 text-white py-3 px-6 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 font-bold transition duration-300 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}
