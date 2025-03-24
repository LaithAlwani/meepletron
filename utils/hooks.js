"use client";
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

export const useGetBoardgames = ({ limit }) => {
  const [boardgames, setBoardgames] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Track "Load More" loading

  const fetchBoardgames = async () => {
    if (boardgames.length === 0) setIsLoading(true);
    setIsLoadingMore(true);

    try {
      const res = await fetch(`/api/boardgames?limit=${limit}&page=${page}`);
      const { data } = await res.json();
      if (!res.ok) return setError(message);
      setBoardgames((prev) => [...prev, ...data.boardgames]);
      setPage((prev) => prev + 1);
      setTotalGames(data.totalGames);
      setHasMore(boardgames.length + data.boardgames.length < data.totalGames); // Check if more games exist
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingMore(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardgames();
  }, []);
  return { isLoading, isLoadingMore, boardgames, totalGames, fetchBoardgames, hasMore, error  };
};
