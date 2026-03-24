import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
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
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    return { user, loading, error };
}
