import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const fetchPRs = async () => {
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
                setPrs(data.items || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPRs();
    }, [token]);

    return { prs, loading, error };
}
