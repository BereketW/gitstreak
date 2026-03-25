import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCache } from '../utils/cache';

export interface GithubUser {
    login: string;
    id: number;
    avatar_url: string;
    name: string;
    public_repos: number;
    followers: number;
    following: number;
}

export function useGithubUser() {
    const { token } = useAuth();
    const [user, setUser] = useState<GithubUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async (isRefresh = false) => {
        if (!token) {
            setLoading(false);
            return;
        }

        const cacheKey = `github_user_${token}`;
        
        if (!isRefresh) {
            const cachedUser = apiCache.get<GithubUser>(cacheKey);
            if (cachedUser) {
                setUser(cachedUser);
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
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            setUser(data);
            apiCache.set(cacheKey, data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return { user, loading, refreshing, error, refresh: () => fetchUser(true) };
}
