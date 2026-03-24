import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const fetchRepos = async () => {
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
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRepos();
    }, [token]);

    return { repos, loading, error };
}
