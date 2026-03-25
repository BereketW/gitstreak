import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCache } from '../utils/cache';

export interface ContributionDay {
    contributionCount: number;
    date: string;
    color: string;
}

export interface ContributionCalendar {
    totalContributions: number;
    weeks: {
        contributionDays: ContributionDay[];
    }[];
}

export function useGithubContributions(username?: string, year?: number) {
    const { token } = useAuth();
    const [calendar, setCalendar] = useState<ContributionCalendar | null>(null);
    const [contributionYears, setContributionYears] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streak, setStreak] = useState({ current: 0, longest: 0, today: false, active: false });

    // Fetch available years once
    useEffect(() => {
        if (!token || !username) return;
        
        const fetchYears = async () => {
            const cacheKey = `github_years_${username}`;
            const cachedYears = apiCache.get<number[]>(cacheKey);
            if (cachedYears) {
                setContributionYears(cachedYears);
                return;
            }

            try {
                const query = `query { user(login: "${username}") { contributionsCollection { contributionYears } } }`;
                const res = await fetch('https://api.github.com/graphql', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                const json = await res.json();
                if (json.data?.user?.contributionsCollection?.contributionYears) {
                    const years = json.data.user.contributionsCollection.contributionYears;
                    setContributionYears(years);
                    apiCache.set(cacheKey, years);
                }
            } catch (e) {
                console.error("Failed to fetch contribution years", e);
            }
        };
        fetchYears();
    }, [token, username]);

    const fetchContributions = useCallback(async (isRefresh = false) => {
        if (!token || !username) {
            setLoading(false);
            return;
        }

        const cacheKey = `github_contributions_${username}_${year || 'all'}`;

        if (!isRefresh) {
            const cachedData = apiCache.get<any>(cacheKey);
            if (cachedData) {
                setCalendar(cachedData.calendar);
                setStreak(cachedData.streak);
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
            let dateFilters = '';
            if (year) {
                const from = `${year}-01-01T00:00:00Z`;
                const to = `${year}-12-31T23:59:59Z`;
                dateFilters = `(from: "${from}", to: "${to}")`;
            }

            const query = `
                query {
                    user(login: "${username}") {
                        contributionsCollection${dateFilters} {
                            contributionCalendar {
                                totalContributions
                                weeks {
                                    contributionDays {
                                        contributionCount
                                        date
                                        color
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            const json = await response.json();
            
            if (json.errors) {
                throw new Error(json.errors[0].message);
            }

            const cal = json.data.user.contributionsCollection.contributionCalendar;
            setCalendar(cal);

            // Calculate streaks for the dataset
            const allDays = cal.weeks.flatMap((w: any) => w.contributionDays);
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;
            let todayHasCommit = false;
            
            // Real streak logic for the fetched calendar
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const todayIndex = allDays.findIndex((d: any) => d.date === todayStr);
            
            if (todayIndex !== -1) {
                todayHasCommit = allDays[todayIndex].contributionCount > 0;
                
                for (let i = todayIndex; i >= 0; i--) {
                    if (allDays[i].contributionCount > 0) {
                        currentStreak++;
                    } else if (i === todayIndex) {
                        // If today is 0, streak can still be ongoing from yesterday
                        continue;
                    } else {
                        break;
                    }
                }
            } else if (year && year < new Date().getFullYear()) {
                // For past years, just calculate the streak at the end of the year if we want, 
                // or keep it 0 as it's not "current" today. We'll leave it as 0.
            }

            // Longest streak
            for (let i = 0; i < allDays.length; i++) {
                if (allDays[i].contributionCount > 0) {
                    tempStreak++;
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                } else {
                    tempStreak = 0;
                }
            }

            const newStreak = { 
                current: currentStreak, 
                longest: longestStreak, 
                today: todayHasCommit,
                active: currentStreak > 0
            };
            setStreak(newStreak);

            apiCache.set(cacheKey, { calendar: cal, streak: newStreak });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, username, year]);

    useEffect(() => {
        fetchContributions();
    }, [fetchContributions]);

    return { calendar, streak, loading, refreshing, error, contributionYears, refresh: () => fetchContributions(true) };
}
