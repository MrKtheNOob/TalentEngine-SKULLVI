// Matches candidates.schemas.CandidateResponse.
export interface CandidateResponse {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
}
