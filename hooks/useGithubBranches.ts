import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface GithubBranch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
}

export function useGithubBranches(repoFullName: string | null) {
    const { token } = useAuth();
    const [branches, setBranches] = useState<GithubBranch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !repoFullName) {
            setBranches([]);
            return;
        }

        const fetchBranches = async () => {
            setLoading(true);
            try {
                const response = await fetch(`https://api.github.com/repos/${repoFullName}/branches`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch branches');
                }

                const data = await response.json();
                setBranches(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
    }, [token, repoFullName]);

    return { branches, loading, error };
}
