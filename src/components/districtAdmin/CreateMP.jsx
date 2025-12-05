import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { parliamentaryConstituencies } from "../../data/constituencies"; 

export default function CreateMP() {
  const navigate = useNavigate();

  const [electionType] = useState("MP Election");
  const [stateName] = useState("Karnataka");
  const [district, setDistrict] = useState("");
  const [electionDate, setElectionDate] = useState("");
  const [constituency, setConstituency] = useState(""); 

  // ✅ NEW: Time States
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("18:00");

  const [data, setData] = useState(null); 
  const [candidates, setCandidates] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const unwrap = (value) => {
    let parsed = value;
    let safety = 0;
    while (safety++ < 15) {
      if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0].d === "string") {
        try { parsed = JSON.parse(parsed[0].d); continue; } catch { break; }
      }
      if (!Array.isArray(parsed) && parsed && typeof parsed === "object" && typeof parsed.d === "string") {
        try { parsed = JSON.parse(parsed.d); continue; } catch { break; }
      }
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); continue; } catch { break; }
      }
      break;
    }
    return parsed;
  };

  const fetchPCCandidates = async (pcId) => {
    setData(null);
    setCandidates([]);
    if (!pcId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/kgis/election/Election.asmx/GetPC_CandidateDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ pc_code: pcId }),
      });

      const text = await res.text();
      let outer;
      try { outer = JSON.parse(text); } catch { outer = text; }

      const unwrapped = unwrap(outer);
      let arr = Array.isArray(unwrapped) ? unwrapped : [unwrapped];

      arr = arr.flatMap((item) => {
        if (item && typeof item === "object" && typeof item.d === "string") {
          try {
            const inner = JSON.parse(item.d);
            return Array.isArray(inner) ? inner : [inner];
          } catch { return [item]; }
        }
        return Array.isArray(item) ? item : [item];
      });

      setData(arr);

      const normalized = arr
        .flatMap((it) => (Array.isArray(it) ? it : [it]))
        .filter(Boolean)
        .map((c) => {
          const cand = c && typeof c === "object" ? c : {};
          const name = cand.Candidate_Name ?? cand.CandidateName ?? "";
          const party = cand.Party_Name ?? cand.PartyName ?? "";
          const rawSymbol = cand.Symbol ?? cand.Symbol_Name ?? "";
          const symbol = String(rawSymbol).split(":")[0];

          let rawBase64 = "";
          let photo_url = null;
          if (cand.Candidate_Photo) {
            try {
              let maybe = String(cand.Candidate_Photo);
              if (maybe.startsWith("data:")) {
                const comma = maybe.indexOf(",");
                if (comma !== -1) maybe = maybe.slice(comma + 1);
              }
              const cleaned = maybe.replace(/\s+/g, "");
              if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length >= 80) {
                rawBase64 = cleaned;
                photo_url = `data:image/jpeg;base64,${cleaned}`;
              } else {
                rawBase64 = ""; 
              }
            } catch {
              rawBase64 = "";
            }
          }

          return {
            name,
            party,
            symbol,
            photo_url,
            _photo_base64_raw: rawBase64,
          };
        })
        .filter(Boolean);

      setCandidates(normalized);
    } catch (err) {
      console.error("fetch error (GetPC_CandidateDetails):", err);
      setError("Failed to fetch PC candidates");
      setData(null);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const onConstituencyChange = (pcId) => {
    setConstituency(pcId);
    const found = parliamentaryConstituencies.find((p) => String(p.id) === String(pcId));
    setDistrict(found.pc);
    fetchPCCandidates(pcId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const candidatesPayload = candidates.map((c) => ({
        name: String(c.name ?? ""),
        party: String(c.party ?? ""),
        symbol: String(c.symbol ?? ""),
        candidate_photo_base64: String(c._photo_base64_raw ?? ""),
      }));

      const found = parliamentaryConstituencies.find((p) => String(p.id) === String(constituency));
      const consisName = found ? (found.pc ?? found.constituency ?? String(found.id)) : String(constituency);

      const payload = {
        election_type: String(electionType ?? ""),
        state: String(stateName ?? ""),
        district: String(district ?? ""),
        election_date: String(electionDate ?? ""),
        constituency: String(consisName ?? ""),
        candidates: candidatesPayload,
        
        // ✅ NEW: Send Times to Backend
        start_time: startTime,
        end_time: endTime,
      };

      console.log("Create payload:", payload);

      const resp = await axios.post("http://localhost:8000/election/create", payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: (status) => status < 500,
      });

      if (resp.status === 200 || resp.status === 201) {
        setMessage("Election created successfully!");
        navigate("/district-dashboard");
        return;
      }

      if (resp.status === 422) {
        const detail = resp.data?.detail;
        if (Array.isArray(detail)) {
          const msg = detail
            .map((d) => (d.loc && d.msg ? `${d.loc.join(" > ")}: ${d.msg}` : JSON.stringify(d)))
            .join("; ");
          setError(msg);
        } else {
          setError(JSON.stringify(resp.data));
        }
        return;
      }

      setError(resp.data?.detail || `Server returned status ${resp.status}`);
    } catch (err) {
      console.error("Request failed:", err);
      if (err.response) {
        setError(err.response.data?.detail || `Request failed with status ${err.response.status}`);
      } else {
        setError(err.message || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 20, fontFamily: "Inter, Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Create MP Election</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Constituency (PC)</label>
          <select value={constituency} onChange={(e) => onConstituencyChange(e.target.value)} required style={{ width: "100%", padding: 8 }}>
            <option value="">-- Select Parliamentary Constituency --</option>
            {parliamentaryConstituencies.map((pc) => (
              <option key={pc.id} value={String(pc.id)}>{pc.id} - {pc.pc ?? pc.constituency}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Election Type</label>
          <input type="text" value={electionType} readOnly style={{ width: "100%", padding: 8, background: "#f3f4f6" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>State</label>
          <input type="text" value={stateName} disabled style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>District</label>
          <input type="text" value={district} disabled style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Election Date</label>
          <input type="date" value={electionDate} onChange={(e) => setElectionDate(e.target.value)} required style={{ width: "100%", padding: 8 }} />
        </div>

        {/* ✅ NEW: Start & End Time Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Start Time</label>
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required 
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>End Time</label>
            <input 
              type="time" 
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required 
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </div>

        <div>
          <h4 style={{ margin: "8px 0" }}>Candidates</h4>
          {loading && <div style={{ color: "#6b7280" }}>Loading candidates…</div>}
          {!loading && candidates.length === 0 && <div style={{ color: "#6b7280" }}>No candidates loaded yet.</div>}

          {candidates.map((c, i) => (
            <div key={i} style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{c.party}</div>
                <div style={{ marginTop: 6, fontSize: 13 }}>Symbol: <strong>{c.symbol}</strong></div>
              </div>
              <div>
                {c.photo_url ? <img src={c.photo_url} alt={c.name} style={{ width: 120, borderRadius: 6 }} /> : <div style={{ width: 120, height: 80, borderRadius: 6, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No photo</div>}
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", borderRadius: 8 }}>
          {loading ? "Creating..." : "Create Election"}
        </button>

        {message && <div style={{ color: "green", textAlign: "center" }}>{message}</div>}
        {error && <div style={{ color: "red", whiteSpace: "pre-wrap", textAlign: "center" }}>{error}</div>}
      </form>
    </div>
  );
}