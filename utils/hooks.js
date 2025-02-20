import { useState, useEffect } from "react";

export const useSearch = ({debounceDelay:debounceDelay = 300, limit}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setResults([])
      setDebouncedQuery(query);
    }, debounceDelay);

    return () => clearTimeout(handler);
  }, [query, debounceDelay]);
  

  useEffect(() => {
    if (!debouncedQuery.trim()) {
    
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?query=${debouncedQuery}&limit=${limit}`);
        const { data } = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, limit]);

  return { query, setQuery, results, loading };
};

