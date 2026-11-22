
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: "CANDIDAT" | "RESPONSABLE" | "ADMIN";
}
