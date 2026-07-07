export interface Employee {
  id: number;
  name: string;
  role_title: string | null;
  phone_number: string | null;
  email: string | null;
  start_date: string;
  monthly_salary: string;
  is_active: boolean;
  performance_notes: string | null;
}

export interface AttendanceRecord {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  status: "present" | "absent" | "half_day" | "on_leave";
  note: string | null;
}

export interface LeaveRequest {
  id: number;
  employee: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
}

export interface Payslip {
  id: number;
  run: number;
  month: string;
  employee: number;
  employee_name: string;
  base_salary: string;
  working_days: number;
  days_absent: string;
  absence_deduction: string;
  other_deduction: string;
  bonus: string;
  net_pay: string;
  is_paid: boolean;
  paid_on: string | null;
}

export interface PayrollRun {
  id: number;
  month: string;
  notes: string | null;
  created_by_name: string | null;
  total_net: string;
  payslips: Payslip[];
  created_at: string;
}

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "half_day", label: "Half day" },
  { value: "on_leave", label: "On leave" },
] as const;

export const LEAVE_TYPES = [
  { value: "annual", label: "Annual" },
  { value: "sick", label: "Sick" },
  { value: "unpaid", label: "Unpaid" },
  { value: "other", label: "Other" },
];

export const formatNaira = (value: string | number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value));

export const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
