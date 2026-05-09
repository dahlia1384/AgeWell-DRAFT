export interface Medication {
  name: string;
  dose: string;
  frequency: string;
}

export interface Resident {
  id: number;
  facility_id: number;
  facility_name?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  room_number: string;
  admission_date: string;
  diagnoses: string[];
  medications: Medication[];
  allergies: string[];
  preferences: Record<string, unknown>;
  language: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  photo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  todaysLogs?: TodaysLogs;
  activeAlerts?: Alert[];
}

export interface TodaysLogs {
  mealLogs: MealLog[];
  sleepLogs: SleepLog[];
  moodCheckins: MoodCheckin[];
  medicationRecords: MedicationRecord[];
  activityLogs: ActivityLog[];
}

export interface MealLog {
  id: number;
  resident_id: number;
  log_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  intake_pct?: number;
  food_items?: string;
  notes?: string;
  created_at: string;
}

export interface SleepLog {
  id: number;
  resident_id: number;
  log_date: string;
  hours?: number;
  quality?: number;
  notes?: string;
  created_at: string;
}

export interface MoodCheckin {
  id: number;
  resident_id: number;
  log_date: string;
  mood: number;
  notes?: string;
  created_at: string;
}

export interface MedicationRecord {
  id: number;
  resident_id: number;
  medication_name: string;
  dose?: string;
  administered_at: string;
  given: number;
  refusal_reason?: string;
  notes?: string;
}

export interface ActivityLog {
  id: number;
  resident_id: number;
  log_date: string;
  activity_name: string;
  participation_level?: 'full' | 'partial' | 'observed' | 'none';
  notes?: string;
}

export interface Alert {
  id: number;
  resident_id: number;
  alert_type: 'manual' | 'system' | 'ai_generated';
  category: 'safety' | 'health' | 'behavior' | 'medication' | 'other';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  room_number?: string;
}

export interface Staff {
  id: number;
  facility_id: number;
  name: string;
  email: string;
  role: 'admin' | 'nurse' | 'caregiver' | 'researcher';
}
