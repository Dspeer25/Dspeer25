// ─── Core Trade Types ───

export interface CustomField {
  id: string;
  label: string;
  type: 'select' | 'text';
  options?: string[];
  description?: string;
}

export interface Trade {
  id: string;
  date: string;
  ticker: string;
  time: string;
  tradeType: 'Day' | 'Swing';
  direction: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  initialRisk: number;
  result: 'W' | 'L' | 'BE';
  dollarPnl: number;
  rr: number;
  notes: string;
  starred: boolean;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | '';
  customFields: Record<string, string>;
  // Accountability fields
  ruleViolation?: boolean;
  violationNote?: string;
}

export interface GradeDefinition {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  description: string;
}

// ─── Journal Types ───

export interface WeeklyGoal {
  id: string;
  text: string;
  completed: boolean;
  measurable?: boolean;
  metric?: string;
  target?: number;
}

export interface DailyJournalEntry {
  date: string;
  observations: string;
  endOfDayReview: string;
  weeklyGoals: WeeklyGoal[];
}

export interface WeeklyCheckin {
  id: string;
  weekStart: string;
  goals: WeeklyGoal[];
  mindsetNote: string;
  focusAreas: string[];
  aiSummary?: string;
  createdAt: string;
}

// ─── Trader Profile (Onboarding) ───

export interface TraderProfile {
  name: string;
  accountSize: number;
  tradingStyle: 'Day Trading' | 'Swing Trading' | 'Both' | '';
  experience: 'Beginner' | 'Intermediate' | 'Advanced' | '';
  markets: string[];
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  personalNote: string;
  onboardingComplete: boolean;
}

// ─── Settings ───

export interface UserSettings {
  customFields: CustomField[];
  gradeDefinitions: GradeDefinition[];
  maxDailyLoss: number;
  maxRiskPerTrade: number;
  focusVideoUrl: string;
}

// ─── AI Chat ───

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Navigation ───

export type TabId = 'home' | 'journal' | 'log' | 'entries' | 'calendar' | 'stats' | 'toolkit' | 'settings' | 'analysis';
