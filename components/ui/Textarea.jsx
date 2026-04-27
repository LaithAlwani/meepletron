const Textarea = ({ name, value, ref, onChange, onInput, onKeyDown, placeholder, rows = 4, disabled = false, className = "" }) => (
  <textarea
    ref={ref}
    name={name}
    value={value}
    onChange={onChange}
    onInput={onInput}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    required
    className={`w-full px-4 py-2 border border-border bg-surface text-foreground placeholder:text-subtle max-h-[120px] resize-none overflow-y-hidden focus:outline-none focus:ring-2 focus:ring-primary transition-all ${className}`}
  />
);

export default Textarea;
