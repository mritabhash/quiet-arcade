import { Navigate } from "react-router-dom";

/**
 * Versus no longer has a lobby of its own — each game's page carries its own
 * 1v1 panel (see components/GameVersusPanel.tsx), and match rooms are reached
 * by shared link at /versus/<code>. This keeps old /versus links working.
 */
export function VersusPage() {
  return <Navigate to="/games" replace />;
}
