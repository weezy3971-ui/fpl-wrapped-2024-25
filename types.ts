
export interface FplHistory {
  current: {
    event: number;
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    overall_rank: number;
    bank: number;
    value: number;
    points_on_bench: number;
    event_transfers: number;
    event_transfers_cost: number;
  }[];
  chips: {
    name: string;
    time: string;
    event: number;
  }[];
}

export interface FplEntry {
  id: number;
  player_first_name: string;
  player_last_name: string;
  player_region_name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  name: string;
}

export interface ChipInfo {
  name: string;
  displayName: string;
  gw: number | null;
  points: number | null;
  used: boolean;
  captainName?: string;
}

export interface PlayerLoyalty {
  name: string;
  weeks: number;
  points: number;
  team: string;
  photo: string;
}

export interface PlayerPerformance {
  name: string;
  points: number;
  team: string;
  position: string;
  code: string;
}

export interface CaptaincyStat {
  name: string;
  count: number;
  percentage: number;
}

export interface WrappedData {
  managerName: string;
  teamName: string;
  totalPoints: number;
  overallRank: number;
  bestGWRank: { rank: number; gw: number };
  bestOverallRank: { rank: number; gw: number };
  rankComment: string;
  bestGameweek: { gw: number; points: number };
  worstGameweek: { gw: number; points: number };
  totalBenchPoints: number;
  worstBenchRegret: { gw: number; points: number };
  consistencyScore: number;
  averagePoints: number;
  gameweekHistory: { gw: number; points: number }[];
  chips: ChipInfo[];
  transferStats: {
    totalTransfers: number;
    maxTransfersInGW: number;
    totalHits: number;
    kneeJerkScore: number;
    isImpulseBuyer: boolean;
    bestTransfer?: {
      playerIn: string;
      playerOut: string;
      impact: number;
    };
    regrettedMove?: {
      playerSold: string;
      playerBought: string;
      gw: number;
      fiveWeekDiff: number;
    };
    immediateRegret?: {
      playerSold: string;
      playerBought: string;
      gw: number;
      pointsDiff: number;
      soldScore: number;
      boughtScore: number;
    };
  };
  teamValue: {
    current: number;
    lowest: number;
    lowestGW: number;
  };
  squadValuation: {
    mostExpensive: { name: string; value: number };
    cheapest: { name: string; value: number };
  };
  arrows: {
    green: number;
    red: number;
    grey: number;
  };
  metrics: {
    hindsightTotal: number;
    captaincyEfficiency: number;
    templateScore: number; 
    styleLabel: string;
  };
  captaincyStats: CaptaincyStat[];
  mvp: PlayerPerformance;
  runnerUp: PlayerPerformance;
  loyaltyList: PlayerLoyalty[];
  diamondHands: PlayerLoyalty[];
  aiPersona?: string;
  aiNarration?: string;
}
