export const Heading = ({ level = 1, children }) => {
  const Tag = `h${level}`;
  const styles = {
    1: "text-4xl font-extrabold text-blue-600 dark:text-yellow-500",
    2: "text-center text-3xl font-semibold mb-4",
    3: "text-2xl font-semibold",
    4: "text-xl font-semibold  text-blue-600 dark:text-yellow-500",
  };

  return <Tag className={styles[level]}>{children}</Tag>;
};

export const Paragraph = ({ children }) => {
  return <p className="text-base text-gray-700">{children}</p>;
};
