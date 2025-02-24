const Textarea = ({ name, value, onChange, onInput, placeholder, rows = 4, disabled = false }) => {
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      onInput={onInput}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required
      className="w-full px-4 py-2 border max-h-[120px]  focus:outline-none  focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 text-gray-900 dark:text-white"
    />
  );
};

export default Textarea;
