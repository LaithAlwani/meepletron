const Textarea = ({ name, value, ref, onChange, onInput, onKeyDown, placeholder, rows = 4, disabled = false }) => {
  return (
    <textarea
      name={name}
      value={value}
      ref={ref}
      onChange={onChange}
      onInput={onInput}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required
      className="w-full px-4 py-2 border max-h-[120px] focus:outline-none overflow-y-hidden  focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500 text-gray-900 dark:text-white resize-none"
    />
  );
};

export default Textarea;
