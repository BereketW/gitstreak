import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGithubUser } from './useGithubUser';
import { apiCache } from '../utils/cache';

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
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async (isRefresh = false) => {
        if (!token || !user?.login) return;
        
        const cacheKey = `github_events_${user.login}`;

        if (!isRefresh) {
            const cachedEvents = apiCache.get<GithubEvent[]>(cacheKey);
            if (cachedEvents) {
                setEvents(cachedEvents);
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

            // Polyfill: GitHub Events API omits `commits` when code is pushed via the Trees API (e.g Streak Assist).
            // We manually fetch the commit using the head SHA for the most recent push to restore the commit message!
            for (let event of data) {
                if (event.type === 'PushEvent' && (!event.payload.commits || event.payload.commits.length === 0) && event.payload.head) {
                    try {
                        const commitRes = await fetch(`https://api.github.com/repos/${event.repo.name}/commits/${event.payload.head}`, {
                            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
                        });
                        if (commitRes.ok) {
                            const commitData = await commitRes.json();
                            event.payload.commits = [{ message: commitData.commit.message }];
                        }
                    } catch (e) {
                        console.error("Polyfill fetch failed", e);
                    }
                    break; // Only polyfill the most recent push to conserve rate limits
                }
            }

            setEvents(data);
            apiCache.set(cacheKey, data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, user?.login]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, loading, refreshing, error, refresh: () => fetchEvents(true) };
}
