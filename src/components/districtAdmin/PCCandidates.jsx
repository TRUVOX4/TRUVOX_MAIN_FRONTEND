// PCCandidates.jsx
import { useState } from "react";
import { parliamentaryConstituencies } from "../../data/constituencies";

export default function PCCandidates() {
  const [selectedPC, setSelectedPC] = useState("");
  const [data, setData] = useState(null); // array of candidate objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Robust unwrapping (handles [{ d: "..." }], { d: "..." }, JSON-strings, nested)
  const unwrap = (value) => {
    let parsed = value;
    let safety = 0;
    while (safety++ < 15) {
      // [{ d: "..." }]
      if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0].d === "string") {
        try { parsed = JSON.parse(parsed[0].d); continue; } catch { break; }
      }
      // { d: "..." }
      if (!Array.isArray(parsed) && parsed && typeof parsed === "object" && typeof parsed.d === "string") {
        try { parsed = JSON.parse(parsed.d); continue; } catch { break; }
      }
      // JSON string
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); continue; } catch { break; }
      }
      break;
    }
    return parsed;
  };

  const fetchPCCandidates = async (pcId) => {
    if (!pcId) {
      setData(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/kgis/election/Election.asmx/GetPC_CandidateDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        // using pc_code as body key; change to other key if your network shows different param
        body: JSON.stringify({ pc_code: pcId }),
      });

      const text = await res.text();
      console.log("RAW (GetPC_CandidateDetails):", text);

      let outer;
      try { outer = JSON.parse(text); } catch { outer = text; }

      const unwrapped = unwrap(outer);
      console.log("UNWRAPPED (GetPC_CandidateDetails):", unwrapped);

      // normalize to array
      let arr = Array.isArray(unwrapped) ? unwrapped : [unwrapped];

      // If elements are objects with d string, parse each and flatten
      arr = arr.flatMap((item) => {
        if (item && typeof item === "object" && typeof item.d === "string") {
          try {
            const inner = JSON.parse(item.d);
            return Array.isArray(inner) ? inner : [inner];
          } catch { return [item]; }
        }
        return Array.isArray(item) ? item : [item];
      });

      console.log("FINAL PC CANDIDATES ARRAY:", arr);
      setData(arr);
    } catch (err) {
      console.error("fetch error (GetPC_CandidateDetails):", err);
      setError("Failed to fetch PC candidates");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2>Parliamentary Constituency — Candidates</h2>

      <select
        value={selectedPC}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedPC(id);
          fetchPCCandidates(id);
        }}
        style={{ padding: 8, fontSize: 14 }}
      >
        <option value="">-- Select Parliamentary Constituency --</option>
        {parliamentaryConstituencies.map((pc) => (
          <option key={pc.id} value={String(pc.id)}>
            {pc.id} - {pc.pc}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 12 }}>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !data && <p>No data yet.</p>}

        {!loading && data && data.length > 0 && (
          <div>
            {data.map((c, idx) => {
              const cand = Array.isArray(c) ? c[0] : c;
              if (!cand || typeof cand !== "object") return null;

              return (
                <div key={cand.Candidate_No ?? idx} style={{ border: "1px solid #eee", padding: 12, marginBottom: 12, borderRadius: 8 }}>
                  <h3 style={{ margin: 0 }}>
                    {cand.Candidate_Name} <small style={{ fontWeight: 400 }}>({cand.Party_Name})</small>
                  </h3>
                  <p style={{ margin: "6px 0" }}><strong>PC / AC:</strong> {cand.PC_Name ?? cand.AC_Name ?? ""}</p>
                  <p style={{ margin: "6px 0" }}><strong>Age:</strong> {cand.Age} &nbsp; <strong>Sex:</strong> {cand.Sex}</p>
                  <p style={{ margin: "6px 0" }}><strong>Reservation:</strong> {cand.Reservation}</p>
                  <p style={{ margin: "6px 0" }}><strong>Symbol:</strong> {cand.Symbol}</p>
                  <p style={{ margin: "6px 0" }}><strong>Qualification:</strong> {cand.Qualification}</p>
                  {cand.Candidate_Photo && (
                    <img src={`data:image/jpeg;base64,${cand.Candidate_Photo}`} alt={cand.Candidate_Name} style={{ width: 150, borderRadius: 6, marginTop: 8 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
