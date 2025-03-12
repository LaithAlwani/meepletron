'use client'
import { useState, useEffect } from "react";

export const useSearch = ({ debounceDelay: debounceDelay = 300, limit }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setResults([]);
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
        const boardgames = await response.json();
        setResults(boardgames);
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

export const useGetBoardgames = ({limit}) => {
  const [boardgames, setBoardgames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const getBoardgames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/boardgames?limit=${limit}`);
      const { data, message } = await res.json();
      if (!res.ok) return setError(message);
      setBoardgames(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBoardgames();
  }, []);
  return { isLoading, boardgames, error };
};
