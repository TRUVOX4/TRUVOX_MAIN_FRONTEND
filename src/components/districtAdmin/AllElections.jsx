import React, { useEffect, useState } from "react";
import axios from "axios";

const IMG_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect fill='%23e5e7eb' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23737479'>No Image</text></svg>`;

const AllElections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedElection, setSelectedElection] = useState(null);
  const [resultElection, setResultElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingResult, setLoadingResult] = useState(false);

  // verification modal state
  const [verifying, setVerifying] = useState(false);
  const [verifyData, setVerifyData] = useState(null);
  const [verifyElection, setVerifyElection] = useState(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await axios.get("http://localhost:8000/election/all");
        setElections(res.data.elections || []);
      } catch (err) {
        console.error("Failed fetching elections:", err);
        setError("Failed to fetch elections (check backend/CORS & console)");
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  const fetchResults = async (electionId) => {
    setLoadingResult(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/vote/results/${electionId}`);
      setResults(res.data.results || []);
      setResultElection(elections.find((e) => e._id === electionId));
    } catch (err) {
      console.error("Failed fetching results:", err);
      setError("Failed to fetch results");
    } finally {
      setLoadingResult(false);
    }
  };

  const verifyElectionIntegrity = async (electionId) => {
    setVerifying(true);
    setVerifyData(null);
    setVerifyElection(elections.find((e) => e._id === electionId));
    try {
      const res = await axios.post("http://localhost:8000/api/vote/verify-election-integrity", {
        election_id: electionId,
      });
      setVerifyData(res.data);
    } catch (err) {
      console.error("Verification error:", err);
      setVerifyData({
        error: true,
        message: err.response?.data?.detail || "Verification failed",
      });
    } finally {
      setVerifying(false);
    }
  };

  // --- Helpers ---

  // Heuristic: whether string "looks like" an image URL or base64 data URL
  const looksLikeImage = (str) => {
    if (!str || typeof str !== "string") return false;
    if (str.startsWith("data:image/")) return true;
    if (/\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(str)) return true;
    // sometimes backend stores base64 without data: prefix (very common)
    // check for long base64-like string (rough heuristic)
    if (/^[A-Za-z0-9+/=\s]+$/.test(str) && str.length > 500) return true;
    return false;
  };

  // Normalize/resolve candidate photo source
  const resolveCandidatePhotoSrc = (cand) => {
    // 1) candidate_photo_base64 preferred
    const b64 = cand?.candidate_photo_base64;
    if (b64 && typeof b64 === "string" && b64.trim()) {
      // if already a data: URL, return as-is
      if (b64.startsWith("data:image/")) return b64;
      // attempt to guess mime; default to jpeg
      // if symbol contains file extension, we could try to infer, but default to jpeg
      return `data:image/jpeg;base64,${b64.trim()}`;
    }

    // 2) explicit photo_url or photo fields (could be relative / absolute)
    const photoUrl = cand?.photo_url || cand?.photo || cand?.photo_path;
    if (photoUrl && typeof photoUrl === "string" && photoUrl.trim()) {
      return photoUrl.trim();
    }

    // 3) no image available
    return IMG_PLACEHOLDER_SVG;
  };

  // Resolve symbol display: either image URL/data OR plain text (symbol name)
  const renderSymbol = (cand) => {
    const symbolUrl = cand?.symbol_url;
    const symbolText = cand?.symbol || cand?.symbol_name || (symbolUrl && !looksLikeImage(symbolUrl) ? symbolUrl : null);

    if (symbolUrl && looksLikeImage(symbolUrl)) {
      // symbolUrl looks like an image (or is data:)
      return (
        <img
          src={symbolUrl}
          alt={`${cand?.name || "candidate"} symbol`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = IMG_PLACEHOLDER_SVG;
            console.warn("Symbol image failed to load:", symbolUrl, cand);
          }}
          className="w-10 h-10 object-contain rounded border"
        />
      );
    }

    if (symbolText) {
      // plain text symbol
      return <div className="px-2 py-1 rounded bg-gray-100 text-xs text-gray-800 border">{symbolText}</div>;
    }

    // fallback
    return <img src={IMG_PLACEHOLDER_SVG} alt="no symbol" className="w-10 h-10 object-contain rounded border" />;
  };

  // global img error handler for photos
  const handlePhotoError = (e, src) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = IMG_PLACEHOLDER_SVG;
    console.warn("Candidate photo failed to load:", src);
  };

  // --- Rendering ---

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center">All Elections</h2>

      {loading && <p className="text-center">Loading elections...</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elections.map((election) => (
          <div key={election._id} className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-2">{election.election_type}</h3>
            <p className="text-gray-700"><strong>State:</strong> {election.state}</p>
            <p className="text-gray-700"><strong>District:</strong> {election.district}</p>
            <p className="text-gray-700"><strong>Constituency:</strong> {election.constituency}</p>
            <p className="text-gray-700">
              <strong>Date:</strong>{" "}
              {election.election_date ? new Date(election.election_date).toLocaleDateString() : "N/A"}
            </p>
            <p className="text-gray-700">
              <strong>Candidates:</strong> {Array.isArray(election.candidates) ? election.candidates.length : 0}
            </p>

            {/* thumbnail strip */}
            {Array.isArray(election.candidates) && election.candidates.length > 0 && (
              <div className="mt-3 flex space-x-2 overflow-x-auto py-2">
                {election.candidates.slice(0, 6).map((c, idx) => {
                  const src = resolveCandidatePhotoSrc(c);
                  return (
                    <img
                      key={idx}
                      src={src}
                      alt={c.name || `candidate-${idx}`}
                      onError={(e) => handlePhotoError(e, src)}
                      className="w-12 h-12 object-cover rounded-full border"
                      title={`${c.name} ${c.party ? `(${c.party})` : ""}`}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => setSelectedElection(election)}
                className="bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
              >
                View Candidates
              </button>

              <button
                onClick={() => fetchResults(election._id)}
                className="bg-green-600 text-white py-1 rounded hover:bg-green-700"
              >
                View Results
              </button>

              <button
                onClick={() => verifyElectionIntegrity(election._id)}
                className="bg-purple-600 text-white py-1 rounded hover:bg-purple-700"
              >
                Verify Integrity
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate modal */}
      {selectedElection && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl w-11/12 max-w-lg relative">
            <button
              onClick={() => setSelectedElection(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-4">{selectedElection.election_type} - Candidates</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedElection.candidates.map((c, idx) => {
                const photoSrc = resolveCandidatePhotoSrc(c);
                return (
                  <div key={idx} className="border p-2 rounded flex items-center space-x-3">
                    <img
                      src={photoSrc}
                      alt={`${c.name || "Candidate"} photo`}
                      onError={(e) => handlePhotoError(e, photoSrc)}
                      className="w-16 h-16 object-cover rounded"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.name || "Unnamed Candidate"}</p>
                      <p className="text-gray-600 text-sm truncate">{c.party || "Independent"}</p>

                      <div className="mt-1 flex items-center space-x-2">
                        {renderSymbol(c)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results & Verification modals kept as-is (not repeated here for brevity) */}
      {/* ... keep your existing modals for results and verification unchanged ... */}

      {/* Minimal results modal just to avoid breaking (same as before) */}
      {resultElection && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl w-11/12 max-w-lg relative">
            <button onClick={() => setResultElection(null)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 font-bold">✕</button>
            <h3 className="text-xl font-semibold mb-4 text-center">{resultElection.election_type} - Results</h3>
            {loadingResult ? <p className="text-center">Loading results...</p> : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((r, idx) => (
                  <div key={idx} className="border p-2 rounded flex justify-between items-center">
                    <span className="font-medium">{r._id}</span>
                    <span className="font-bold text-blue-600">{r.count} votes</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-gray-600">No votes recorded yet.</p>}
          </div>
        </div>
      )}

      {verifyElection && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 rounded-xl w-11/12 max-w-2xl relative">
            <button onClick={() => setVerifyElection(null)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 font-bold">✕</button>
            <h3 className="text-xl font-semibold mb-4 text-center text-purple-700">{verifyElection.election_type} - Blockchain Verification</h3>
            {verifying && <p className="text-center">Verifying votes on blockchain...</p>}
            {verifyData && !verifying && (
              <div className="space-y-4">
                {verifyData.error ? <p className="text-red-600 text-center">{verifyData.message}</p> : (
                  <>
                    <p className="text-center text-gray-700">✅ Verified: {verifyData.verified_count} | ⚠️ Corrected: {verifyData.corrected_count}</p>
                    {verifyData.corrected_count > 0 && (<div className="border-t pt-3">
                      <h4 className="font-semibold mb-2 text-red-600">Corrected Entries:</h4>
                      {verifyData.corrected.map((c, idx) => (
                        <div key={idx} className="border p-2 rounded mb-2 text-sm bg-red-50">
                          <p><strong>Txn:</strong> {c.transaction_id}</p>
                          <p><strong>Old:</strong> {c.old}</p>
                          <p><strong>New:</strong> {c.new}</p>
                        </div>
                      ))}
                    </div>)}
                    {verifyData.verified_count > 0 && (<div className="border-t pt-3">
                      <h4 className="font-semibold mb-2 text-green-600">Verified Votes:</h4>
                      {verifyData.verified.map((v, idx) => (
                        <div key={idx} className="border p-2 rounded mb-2 text-sm bg-green-50">
                          <p><strong>Txn:</strong> {v.transaction_id}</p>
                          <p>{v.epic_id} → {v.candidate}</p>
                        </div>
                      ))}
                    </div>)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllElections;
