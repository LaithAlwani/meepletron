const Input = ({ name, ref = null, type = "text", placeholder, value, onChange, isHidden = false }) => {
  return (
    <input
      type={type}
      ref={ref}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300  focus:outline-none  focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500  text-gray-900 dark:text-white"
      required
      hidden={isHidden}
    />
  );
};

export default Input;
