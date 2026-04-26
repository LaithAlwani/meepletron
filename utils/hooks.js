"use client";
import { useState, useEffect, useRef, useCallback } from "react";

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const pageRef = useRef(1);
  const busyRef = useRef(false); // prevents concurrent fetches

  const fetchBoardgames = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (pageRef.current === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await fetch(`/api/boardgames?limit=${limit}&page=${pageRef.current}`);
      const { data } = await res.json();
      if (!res.ok) { setError(data?.message ?? "Failed to load"); return; }
      setBoardgames((prev) => {
        const next = [...prev, ...data.boardgames];
        setHasMore(next.length < data.totalGames);
        return next;
      });
      setTotalGames(data.totalGames);
      pageRef.current += 1;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      busyRef.current = false;
    }
  }, [limit]);

  useEffect(() => {
    fetchBoardgames();
  }, [fetchBoardgames]);

  return { isLoading, isLoadingMore, boardgames, totalGames, fetchBoardgames, hasMore, error };
};
