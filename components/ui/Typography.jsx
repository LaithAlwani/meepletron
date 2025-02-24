export const Heading = ({ level = 1, children }) => {
  const Tag = `h${level}`;
  const styles = {
    1: "text-4xl font-bold",
    2: "text-3xl font-semibold",
    3: "text-2xl font-medium",
  };

  return <Tag className={styles[level]}>{children}</Tag>;
};

export const Paragraph = ({ children }) => {
  return <p className="text-base text-gray-700">{children}</p>;
};