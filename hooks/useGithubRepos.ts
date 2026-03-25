import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCache } from '../utils/cache';

export interface GithubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    updated_at: string;
    owner: {
        login: string;
    }
}

export function useGithubRepos() {
    const { token } = useAuth();
    const [repos, setRepos] = useState<GithubRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRepos = useCallback(async (isRefresh = false) => {
        if (!token) return;

        const cacheKey = `github_repos_${token}`;

        if (!isRefresh) {
            const cachedRepos = apiCache.get<GithubRepo[]>(cacheKey);
            if (cachedRepos) {
                setRepos(cachedRepos);
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
            const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }

            const data = await response.json();
            setRepos(data);
            apiCache.set(cacheKey, data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRepos();
    }, [fetchRepos]);

    return { repos, loading, refreshing, error, refresh: useCallback(() => fetchRepos(true), [fetchRepos]) };
}
