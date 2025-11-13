export interface OrgNode {
  id: string;
  name: string;
  type: "company" | "legal_entity" | "department" | "team" | "employee";
  manager?: boolean;
  children?: OrgNode[];
  employeeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  city: string;
  email: string;
  skills: string[];
  photoUrl?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  location?: string;
  manager?: boolean;
}
