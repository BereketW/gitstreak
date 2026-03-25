import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCache } from '../utils/cache';

export interface GithubPR {
    id: number;
    title: string;
    state: string;
    created_at: string;
    updated_at: string;
    html_url: string;
    repository_url: string;
    user: {
        login: string;
        avatar_url: string;
    };
    draft: boolean;
    labels: { name: string; color: string }[];
}

export function useGithubPullRequests() {
    const { token } = useAuth();
    const [prs, setPrs] = useState<GithubPR[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPRs = useCallback(async (isRefresh = false) => {
        if (!token) return;

        const cacheKey = `github_prs_${token}`;

        if (!isRefresh) {
            const cachedPRs = apiCache.get<GithubPR[]>(cacheKey);
            if (cachedPRs) {
                setPrs(cachedPRs);
                setLoading(false);
                return;
            }
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await fetch('https://api.github.com/search/issues?q=is:pr+author:@me+state:open+sort:updated-desc', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pull requests');
            }

            const data = await response.json();
            const fetchedPrs = data.items || [];
            setPrs(fetchedPrs);
            apiCache.set(cacheKey, fetchedPrs);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPRs();
    }, [fetchPRs]);

    return { prs, loading, refreshing, error, refresh: useCallback(() => fetchPRs(true), [fetchPRs]) };
}
