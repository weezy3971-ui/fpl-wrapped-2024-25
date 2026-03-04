
import { FplEntry, FplHistory, WrappedData, ChipInfo, PlayerLoyalty, PlayerPerformance, CaptaincyStat } from '../types';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

// Supabase Edge Function proxy URL (set VITE_SUPABASE_PROXY_URL in .env)
const SUPABASE_PROXY_URL = import.meta.env.VITE_SUPABASE_PROXY_URL as string | undefined;

// Public proxies as fallback only
const PUBLIC_PROXY_URLS = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?'
];

async function fetchWithRetry(targetUrl: string): Promise<any> {
    // 1. Try Supabase Edge Function first (reliable, server-side, no CORS)
    if (SUPABASE_PROXY_URL) {
        try {
            const path = targetUrl.replace(FPL_BASE_URL, '');
            const proxyUrl = `${SUPABASE_PROXY_URL}?path=${encodeURIComponent(path)}`;
            const res = await fetch(proxyUrl);
            if (res.status === 404) throw { status: 404, message: "Resource not found" };
            if (res.ok) return await res.json();
        } catch (e: any) {
            if (e.status === 404) throw e;
            // Fall through to public proxies
        }
    }

    // 2. Fall back to public proxies
    for (const proxy of PUBLIC_PROXY_URLS) {
        try {
            const fullUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
            const res = await fetch(fullUrl);
            if (res.status === 404) throw { status: 404, message: "Resource not found" };
            if (res.ok) {
                const text = await res.text();
                return JSON.parse(text);
            }
        } catch (e: any) {
            if (e.status === 404) throw e;
            // Continue to next proxy
        }
    }
    throw new Error("Unable to fetch FPL data. Please check your internet connection and try again.");
}

export async function fetchFplData(teamId: string): Promise<WrappedData> {
    // 1. Fetch Basic Manager Data
    const entryUrl = `${FPL_BASE_URL}/entry/${teamId}/`;
    const historyUrl = `${FPL_BASE_URL}/entry/${teamId}/history/`;
    const transfersUrl = `${FPL_BASE_URL}/entry/${teamId}/transfers/`;
    const staticUrl = `${FPL_BASE_URL}/bootstrap-static/`;

    let entry: FplEntry;
    let history: FplHistory;
    let transfers: any[];
    let staticData: any;

    try {
        const results = await Promise.all([
            fetchWithRetry(entryUrl),
            fetchWithRetry(historyUrl),
            fetchWithRetry(transfersUrl),
            fetchWithRetry(staticUrl)
        ]);

        entry = results[0];
        history = results[1];
        transfers = results[2];
        staticData = results[3];

    } catch (e: any) {
        if (e.status === 404) {
            throw new Error(`Manager ID ${teamId} not found.`);
        }
        throw new Error("Failed to fetch FPL data. This is likely a network or proxy issue. Please try again.");
    }

    if (!history.current || history.current.length === 0) {
        throw new Error("No season history found for this manager.");
    }

    // Identify Chip Usage Weeks to Filter Transfers
    const chipUsageGWs = new Set(
        (history.chips || [])
            .filter(c => c.name === 'wildcard' || c.name === 'freehit')
            .map(c => c.event)
    );

    // Filter transfers: Exclude those made during Wildcard or Free Hit weeks
    const validTransfers = transfers.filter((t: any) => !chipUsageGWs.has(t.event));

    // 2. Fetch ALL Picks for Accuracy
    const activeGWs = history.current.map(h => h.event);

    // We handle picks separately because one failed GW shouldn't fail the whole app
    const picksPromises = activeGWs.map(gw =>
        fetchWithRetry(`${FPL_BASE_URL}/entry/${teamId}/event/${gw}/picks/`)
            .catch(() => null)
    );

    const allPicksResponses = await Promise.all(picksPromises);
    const picksByGW = new Map<number, any>();
    activeGWs.forEach((gw, i) => {
        if (allPicksResponses[i]) picksByGW.set(gw, allPicksResponses[i]);
    });

    // --- Processing Data ---

    // A. Accurate Player Ownership & Captaincy Tracking
    const playerOwnedCounts = new Map<number, number>();
    const distinctPlayersOfInterest = new Set<number>();
    const captainIds = new Set<number>();
    const allOwnedElementIds = new Set<number>();

    // Track captain counts by name
    const captainCounts = new Map<string, number>();

    let totalCaptainPoints = 0;
    let totalOwnershipSum = 0;
    let totalPlayersCounted = 0;

    activeGWs.forEach(gw => {
        const picks = picksByGW.get(gw);
        if (!picks) return;

        picks.picks.forEach((p: any) => {
            playerOwnedCounts.set(p.element, (playerOwnedCounts.get(p.element) || 0) + 1);
            distinctPlayersOfInterest.add(p.element);
            allOwnedElementIds.add(p.element);

            if (p.multiplier > 0) {
                const playerStatic = staticData.elements.find((e: any) => e.id === p.element);
                if (playerStatic) {
                    totalOwnershipSum += parseFloat(playerStatic.selected_by_percent);
                    totalPlayersCounted++;
                }
            }

            if (p.is_captain) {
                captainIds.add(p.element);
                const playerStatic = staticData.elements.find((e: any) => e.id === p.element);
                const name = playerStatic ? playerStatic.web_name : "Unknown";
                captainCounts.set(name, (captainCounts.get(name) || 0) + 1);
            }
        });
    });

    // Calculate captaincy percentages
    const totalCaptains = activeGWs.length;
    const captaincyStats = Array.from(captainCounts.entries())
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalCaptains > 0 ? Math.round((count / totalCaptains) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

    // B. Fetch Player Histories
    const highOwnershipPlayers = Array.from(playerOwnedCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(x => x[0]);

    const transferPlayerIds = new Set<number>();
    validTransfers.forEach((t: any) => {
        transferPlayerIds.add(t.element_in);
        transferPlayerIds.add(t.element_out);
    });

    const playersToFetch = new Set([...captainIds, ...highOwnershipPlayers, ...transferPlayerIds]);
    const playerHistoryMap = new Map<number, any>();

    // Batch fetch player histories
    await Promise.all(Array.from(playersToFetch).map(async (pid) => {
        try {
            const data = await fetchWithRetry(`${FPL_BASE_URL}/element-summary/${pid}/`);
            if (data && data.history) {
                playerHistoryMap.set(pid, data.history);
            }
        } catch (e) { }
    }));

    // C. Calculate Accurate Captain Points & MVP
    const realPlayerPointsForManager = new Map<number, number>();

    highOwnershipPlayers.forEach(pid => {
        const hist = playerHistoryMap.get(pid);
        if (hist) {
            let pts = 0;
            hist.forEach((h: any) => {
                const picks = picksByGW.get(h.round);
                if (picks && picks.picks.some((p: any) => p.element === pid)) {
                    pts += h.total_points;
                }
            });
            realPlayerPointsForManager.set(pid, pts);
        } else {
            const p = staticData.elements.find((e: any) => e.id === pid);
            if (p) realPlayerPointsForManager.set(pid, p.total_points);
        }
    });

    activeGWs.forEach(gw => {
        const picks = picksByGW.get(gw);
        if (!picks) return;
        const cap = picks.picks.find((p: any) => p.is_captain);
        if (cap) {
            const hist = playerHistoryMap.get(cap.element);
            // Handle DGW captain points safely
            const gwStats = hist ? hist.filter((h: any) => h.round === gw) : [];
            const rawPoints = gwStats.reduce((sum: number, h: any) => sum + h.total_points, 0);
            totalCaptainPoints += rawPoints * cap.multiplier;
        }
    });

    // --- Constructing Sections ---

    const diamondHandsList: PlayerLoyalty[] = Array.from(playerOwnedCounts.entries())
        .filter(([id, count]) => count >= 15)
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => {
            const p = staticData.elements.find((e: any) => e.id === id);
            const team = staticData.teams.find((t: any) => t.id === p?.team);
            return p ? {
                name: p.web_name,
                weeks: count,
                points: realPlayerPointsForManager.get(id) || p.total_points,
                team: team?.short_name || "",
                photo: p.code
            } : null;
        })
        .filter((p): p is PlayerLoyalty => p !== null);

    const loyaltyList = diamondHandsList.slice(0, 5);

    const sortedByPoints = Array.from(realPlayerPointsForManager.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id, pts]) => {
            const p = staticData.elements.find((e: any) => e.id === id);
            return { ...p, pointsForManager: pts };
        });

    const mvpData = sortedByPoints[0] || staticData.elements[0];
    const runnerUpData = sortedByPoints[1] || staticData.elements[1];

    const getPerformance = (p: any): PlayerPerformance => ({
        name: p.web_name,
        points: p.pointsForManager || 0,
        team: staticData.teams.find((t: any) => t.id === p.team)?.short_name || "PL",
        position: p.element_type === 1 ? "GKP" : p.element_type === 2 ? "DEF" : p.element_type === 3 ? "MID" : "FWD",
        code: p.code.toString()
    });

    // 4. Tactical DNA (Template vs Maverick)
    const avgOwnership = totalPlayersCounted > 0 ? totalOwnershipSum / totalPlayersCounted : 0;
    const templateScore = Math.min(100, Math.max(0, ((avgOwnership - 10) / 25) * 100));
    const styleLabel = templateScore >= 50 ? "Template" : "Maverick";

    // 5. The Pit & Peaks
    let maxPoints = -1, minPoints = 9999, bestGW = 1, worstGW = 1;
    let totalBench = 0, maxBench = -1, maxBenchGW = 1;
    let bestOverallRankValue = 99999999, bestOverallRankGW = 1;

    history.current.forEach(gw => {
        if (gw.points < minPoints) { minPoints = gw.points; worstGW = gw.event; }
        if (gw.points > maxPoints) { maxPoints = gw.points; bestGW = gw.event; }
        if (gw.overall_rank < bestOverallRankValue) { bestOverallRankValue = gw.overall_rank; bestOverallRankGW = gw.event; }
        totalBench += gw.points_on_bench;
        if (gw.points_on_bench > maxBench) { maxBench = gw.points_on_bench; maxBenchGW = gw.event; }
    });

    // 6. Transfer Report

    let bestTransferCalc = { impact: -9999, t: null as any };
    let regretCalc = { diff: -9999, t: null as any, soldScore: 0, boughtScore: 0 };

    const getPointsForGW = (hist: any[], gw: number) => {
        if (!hist) return 0;
        return hist
            .filter((h: any) => h.round === gw)
            .reduce((sum: number, h: any) => sum + h.total_points, 0);
    };

    validTransfers.forEach((t: any) => {
        const inHist = playerHistoryMap.get(t.element_in);
        const outHist = playerHistoryMap.get(t.element_out);

        if (inHist && outHist) {
            let pointsIn = 0;
            let pointsOut = 0;

            // Calculate cumulative points for next 5 gameweeks
            for (let i = 0; i < 5; i++) {
                const targetGW = t.event + i;
                pointsIn += getPointsForGW(inHist, targetGW);
                pointsOut += getPointsForGW(outHist, targetGW);
            }

            const impact = pointsIn - pointsOut;
            const regretDiff = pointsOut - pointsIn;

            if (impact > bestTransferCalc.impact) {
                bestTransferCalc = { impact, t };
            }

            if (regretDiff > 15 && regretDiff > regretCalc.diff) {
                regretCalc = { diff: regretDiff, t, soldScore: pointsOut, boughtScore: pointsIn };
            }
        }
    });

    const bestTransfer = bestTransferCalc.t ? {
        playerIn: staticData.elements.find((e: any) => e.id === bestTransferCalc.t.element_in)?.web_name || "Unknown",
        playerOut: staticData.elements.find((e: any) => e.id === bestTransferCalc.t.element_out)?.web_name || "Unknown",
        impact: bestTransferCalc.impact
    } : undefined;

    const immediateRegret = regretCalc.t ? {
        playerSold: staticData.elements.find((e: any) => e.id === regretCalc.t.element_out)?.web_name || "Unknown",
        playerBought: staticData.elements.find((e: any) => e.id === regretCalc.t.element_in)?.web_name || "Unknown",
        gw: regretCalc.t.event,
        pointsDiff: regretCalc.diff,
        soldScore: regretCalc.soldScore,
        boughtScore: regretCalc.boughtScore
    } : undefined;

    // 7. Chips
    const chipNames: Record<string, string> = {
        '3xc': 'Triple Captain',
        'bboost': 'Bench Boost',
        'freehit': 'Free Hit',
        'wildcard': 'Wildcard',
        'manager': 'Manager Chip'
    };
    const chipCounts: Record<string, number> = {};
    const chips: ChipInfo[] = (history.chips || []).map(c => {
        chipCounts[c.name] = (chipCounts[c.name] || 0) + 1;
        const gwData = history.current.find(g => g.event === c.event);
        let displayName = chipNames[c.name] || c.name;
        if (c.name === 'wildcard' && (history.chips.filter(x => x.name === 'wildcard').length > 1)) {
            displayName = `Wildcard ${chipCounts[c.name]}`;
        }
        return { name: c.name, displayName, gw: c.event, points: gwData ? gwData.points : 0, used: true };
    });

    // 8. Knee Jerk
    let kneeJerkCount = 0;
    validTransfers.forEach((t: any) => {
        const transferTime = new Date(t.time).getTime();
        const eventId = t.event;
        const prevEvent = staticData.events.find((e: any) => e.id === eventId - 1);

        if (prevEvent) {
            const prevDeadlineTime = new Date(prevEvent.deadline_time).getTime();
            const hoursSincePrevDeadline = (transferTime - prevDeadlineTime) / (1000 * 60 * 60);
            if (hoursSincePrevDeadline > 0 && hoursSincePrevDeadline <= 72) {
                kneeJerkCount++;
            }
        }
    });
    const kneeJerkScore = validTransfers.length > 0 ? Math.round((kneeJerkCount / validTransfers.length) * 100) : 0;

    const avgCapPoints = totalCaptainPoints / activeGWs.length;
    const capEfficiency = Math.min(100, Math.round((avgCapPoints / 16) * 100));

    let rankComment = "Solid effort.";
    if (entry.summary_overall_rank < 10000) rankComment = "Absolute World Class.";
    else if (entry.summary_overall_rank < 100000) rankComment = "Elite Manager Status.";
    else if (entry.summary_overall_rank < 500000) rankComment = "Top Tier Tactician.";
    else if (entry.summary_overall_rank < 2000000) rankComment = "Respectable Campaign.";
    else rankComment = "Better Luck Next Year.";

    // 9. Team Value Stats
    const teamValues = history.current.map(h => h.value);
    const currentTeamValue = teamValues[teamValues.length - 1];
    const lowestTeamValue = Math.min(...teamValues);
    const lowestTeamValueGW = history.current.find(h => h.value === lowestTeamValue)?.event || 1;

    // 10. Squad Valuations
    let mostExpensiveAsset = { name: '', value: -1 };
    let cheapestAsset = { name: '', value: 9999 };

    allOwnedElementIds.forEach(id => {
        const el = staticData.elements.find((e: any) => e.id === id);
        if (el) {
            if (el.now_cost > mostExpensiveAsset.value) mostExpensiveAsset = { name: el.web_name, value: el.now_cost };
            if (el.now_cost < cheapestAsset.value) cheapestAsset = { name: el.web_name, value: el.now_cost };
        }
    });

    // 11. Arrows
    let greenArrows = 0;
    let redArrows = 0;
    let greyArrows = 0;

    if (history.current.length > 0) greyArrows++;

    for (let i = 1; i < history.current.length; i++) {
        const currentRank = history.current[i].overall_rank;
        const prevRank = history.current[i - 1].overall_rank;

        if (currentRank < prevRank) greenArrows++;
        else if (currentRank > prevRank) redArrows++;
        else greyArrows++;
    }

    return {
        managerName: `${entry.player_first_name} ${entry.player_last_name}`,
        teamName: entry.name,
        totalPoints: entry.summary_overall_points,
        overallRank: entry.summary_overall_rank,
        bestGWRank: { rank: 999, gw: 1 },
        bestOverallRank: { rank: bestOverallRankValue, gw: bestOverallRankGW },
        rankComment,
        bestGameweek: { gw: bestGW, points: maxPoints },
        worstGameweek: { gw: worstGW, points: minPoints },
        totalBenchPoints: totalBench,
        worstBenchRegret: { gw: maxBenchGW, points: maxBench },
        consistencyScore: 0,
        averagePoints: Math.round(entry.summary_overall_points / activeGWs.length),
        gameweekHistory: history.current.map(g => ({ gw: g.event, points: g.points })),
        chips,
        transferStats: {
            totalTransfers: transfers.length,
            maxTransfersInGW: Math.max(...history.current.map(g => g.event_transfers), 0),
            totalHits: history.current.reduce((acc, g) => acc + g.event_transfers_cost, 0),
            kneeJerkScore,
            isImpulseBuyer: kneeJerkScore > 30,
            bestTransfer,
            immediateRegret
        },
        teamValue: {
            current: currentTeamValue,
            lowest: lowestTeamValue,
            lowestGW: lowestTeamValueGW
        },
        squadValuation: {
            mostExpensive: mostExpensiveAsset,
            cheapest: cheapestAsset
        },
        arrows: {
            green: greenArrows,
            red: redArrows,
            grey: greyArrows
        },
        metrics: {
            hindsightTotal: 0,
            captaincyEfficiency: capEfficiency,
            templateScore,
            styleLabel
        },
        captaincyStats,
        mvp: getPerformance(mvpData),
        runnerUp: getPerformance(runnerUpData),
        loyaltyList,
        diamondHands: diamondHandsList
    };
}

export function getMockData(): WrappedData {
    return {
        managerName: "Mock Manager",
        teamName: "Mock FC",
        totalPoints: 2000,
        overallRank: 100000,
        bestGWRank: { rank: 1000, gw: 1 },
        bestOverallRank: { rank: 50000, gw: 10 },
        rankComment: "Mock Data",
        bestGameweek: { gw: 5, points: 100 },
        worstGameweek: { gw: 20, points: 20 },
        totalBenchPoints: 100,
        worstBenchRegret: { gw: 5, points: 20 },
        consistencyScore: 50,
        averagePoints: 60,
        gameweekHistory: [],
        chips: [],
        transferStats: { totalTransfers: 20, maxTransfersInGW: 2, totalHits: 4, kneeJerkScore: 20, isImpulseBuyer: false },
        teamValue: { current: 1025, lowest: 1000, lowestGW: 1 },
        squadValuation: { mostExpensive: { name: "Haaland", value: 152 }, cheapest: { name: "Taylor", value: 40 } },
        arrows: { green: 15, red: 10, grey: 1 },
        metrics: { hindsightTotal: 0, captaincyEfficiency: 80, templateScore: 50, styleLabel: "Template" },
        captaincyStats: [
            { name: "Haaland", count: 19, percentage: 50 },
            { name: "Salah", count: 15, percentage: 40 },
            { name: "Palmer", count: 4, percentage: 10 }
        ],
        mvp: { name: "Mock Player", points: 200, team: "ARS", position: "MID", code: "123" },
        runnerUp: { name: "Mock Player 2", points: 180, team: "LIV", position: "FWD", code: "456" },
        loyaltyList: [],
        diamondHands: []
    }
}
