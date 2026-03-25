export interface CustomField {
  id: string;
  label: string;
  type: 'select' | 'text';
  options?: string[];
  description?: string;
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  ticker: string;
  time: string; // HH:MM
  tradeType: 'Day' | 'Swing';
  initialRisk: number;
  result: 'W' | 'L' | 'BE';
  dollarPnl: number;
  rr: number;
  notes: string;
  starred: boolean;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | '';
  customFields: Record<string, string>;
}

export interface GradeDefinition {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  description: string;
}

export interface WeeklyGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyJournalEntry {
  date: string;
  observations: string;
  endOfDayReview: string;
  weeklyGoals: WeeklyGoal[];
}

export interface UserSettings {
  customFields: CustomField[];
  gradeDefinitions: GradeDefinition[];
  maxDailyLoss: number;
  focusVideoUrl: string;
}

export type TabId = 'entry' | 'entries' | 'calendar' | 'journal' | 'stats' | 'leaderboard' | 'focus' | 'settings' | 'analysis';
