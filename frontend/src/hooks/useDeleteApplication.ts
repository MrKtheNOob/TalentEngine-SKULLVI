import { useState } from "react";
import { deleteApplication } from "../services/programApplicationService";

export function useDeleteApplication(programId: number, applicationId: number) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    const result = await deleteApplication(programId, applicationId);
    setDeleting(false);
    setError(result.error);
    return result;
  }

  return { remove, deleting, error };
}
