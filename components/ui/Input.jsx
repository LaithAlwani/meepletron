const Input = ({ name, ref = null, type = "text", placeholder, value, onChange, isHidden = false }) => (
  <input
    ref={ref}
    type={type}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required
    hidden={isHidden}
    className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-all"
  />
);

export default Input;
