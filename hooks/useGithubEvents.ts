import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGithubUser } from './useGithubUser';

export interface GithubEvent {
    id: string;
    type: string;
    actor: {
        login: string;
        avatar_url: string;
    };
    repo: {
        name: string;
    };
    payload: any;
    created_at: string;
}

export function useGithubEvents() {
    const { token } = useAuth();
    const { user } = useGithubUser();
    const [events, setEvents] = useState<GithubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !user?.login) return;

        const fetchEvents = async () => {
            try {
                const response = await fetch(`https://api.github.com/users/${user.login}/events`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch events');
                }

                const data = await response.json();
                setEvents(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [token, user?.login]);

    return { events, loading, error };
}
