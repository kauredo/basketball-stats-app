import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import SEOHead from "../components/seo/SEOHead";

type JoinStatus = "loading" | "confirm" | "joining" | "success" | "error";

export default function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token, isLoading, selectLeague } = useAuth();
  const [status, setStatus] = useState<JoinStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string>("");

  const joinByCodeMutation = useMutation(api.leagues.joinByCode);

  // Fetch league info for confirmation
  const leagueInfo = useQuery(
    api.leagues.getLeagueByInviteCode,
    inviteCode ? { code: inviteCode } : "skip"
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Store invite code and redirect to login
      sessionStorage.setItem("pendingInviteCode", inviteCode || "");
      navigate("/login", { state: { from: `/join/${inviteCode}` } });
      return;
    }

    if (!inviteCode || !token) {
      setStatus("error");
      setError("Invalid invite link");
      return;
    }

    // Clear pending code now that we're on the page
    sessionStorage.removeItem("pendingInviteCode");

    // Wait for league info to load
    if (leagueInfo === undefined) {
      setStatus("loading");
      return;
    }

    // League not found
    if (leagueInfo === null) {
      setStatus("error");
      setError("This invite link is no longer valid");
      return;
    }

    // Show confirmation
    setStatus("confirm");
  }, [isAuthenticated, isLoading, inviteCode, token, navigate, leagueInfo]);

  const handleJoin = async () => {
    if (!inviteCode || !token) return;

    setStatus("joining");
    try {
      const result = await joinByCodeMutation({ token, code: inviteCode });
      setLeagueName(result.league.name);
      setStatus("success");

      // Auto-select the joined league
      if (result.league) {
        selectLeague(result.league as any);
      }

      // Redirect to app after short delay
      setTimeout(() => navigate("/app"), 2000);
    } catch (err: any) {
      setStatus("error");
      if (err.message?.includes("Already a member")) {
        setError("You're already a member of this league.");
        setTimeout(() => navigate("/app"), 2000);
      } else {
        setError(err.message || "Failed to join league");
      }
    }
  };

  const handleCancel = () => {
    navigate("/app");
  };

  return (
    <>
      <SEOHead
        title="Join League"
        description="Join a basketball league on Basketball Stats."
        robots="noindex, nofollow"
      />
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {status === "loading" ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                Loading...
              </h1>
            </div>
          ) : status === "confirm" && leagueInfo ? (
            <div className="bg-white dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                  Join League
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  You've been invited to join a league
                </p>
              </div>

              <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                  {leagueInfo.name}
                </h2>
                {leagueInfo.description && (
                  <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                    {leagueInfo.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-surface-500 dark:text-surface-400">
                  <span>{leagueInfo.membersCount} members</span>
                  <span>{leagueInfo.teamsCount} teams</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Join League
                </button>
              </div>
            </div>
          ) : status === "joining" ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                Joining League...
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Please wait while we process your request
              </p>
            </div>
          ) : status === "success" ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                Welcome to {leagueName}!
              </h1>
              <p className="text-surface-600 dark:text-surface-400">
                Redirecting you to the app...
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                {error || "Something went wrong"}
              </h1>
              <button
                onClick={() => navigate("/app")}
                className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Go to App
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
