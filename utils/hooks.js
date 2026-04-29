"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export const useSearch = ({ debounceDelay = 300, limit, includeExpansions = false }) => {
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
        const params = new URLSearchParams({ query: debouncedQuery, limit, includeExpansions });
        const response = await fetch(`/api/search?${params}`);
        const boardgames = await response.json();
        setResults(boardgames);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, limit, includeExpansions]);

  return { query, setQuery, results, loading };
};

export const useGetBoardgames = ({ limit, filters = {} }) => {
  const { players = null, time = null, hasExpansions = false, hasRulebook = false } = filters;

  const [boardgames, setBoardgames] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const pageRef = useRef(1);
  const busyRef = useRef(false);

  const fetchBoardgames = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (pageRef.current === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit, page: pageRef.current });
      if (players) params.set("players", players);
      if (time) params.set("time", time);
      if (hasExpansions) params.set("hasExpansions", "true");
      if (hasRulebook) params.set("hasRulebook", "true");

      const res = await fetch(`/api/boardgames?${params}`);
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
  }, [limit, players, time, hasExpansions, hasRulebook]);

  // Resets state and fetches from page 1 whenever fetchBoardgames changes (filter/limit change)
  useEffect(() => {
    setBoardgames([]);
    setTotalGames(0);
    setHasMore(true);
    pageRef.current = 1;
    busyRef.current = false;
    fetchBoardgames();
  }, [fetchBoardgames]);

  return { isLoading, isLoadingMore, boardgames, totalGames, fetchBoardgames, hasMore, error };
};
