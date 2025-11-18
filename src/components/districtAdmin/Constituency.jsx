import { useState } from "react";
import { karnatakaConstituencies } from "../../data/constituencies";

export default function Constituency() {
  const [selectedAC, setSelectedAC] = useState("");
  const [data, setData] = useState(null); // array of candidate objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unwrapResponse = (value) => {
    // Recursively unwrap patterns until stable
    let parsed = value;
    let safety = 0;
    while (safety++ < 15) {
      // If it's an array of length 1 and element has 'd' string: [{ d: "..." }]
      if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0].d === "string") {
        try {
          parsed = JSON.parse(parsed[0].d);
          continue;
        } catch (e) {
          // cannot parse inner d, break and return what we have
          break;
        }
      }

      // If it's an object with d: "..."
      if (!Array.isArray(parsed) && parsed && typeof parsed === "object" && typeof parsed.d === "string") {
        try {
          parsed = JSON.parse(parsed.d);
          continue;
        } catch (e) {
          break;
        }
      }

      // If it's a JSON string like "[{...}]" or "{\"a\":...}"
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
          continue;
        } catch (e) {
          break;
        }
      }

      // Nothing to unwrap further
      break;
    }
    return parsed;
  };

  const getCandidateDetails = async (ac) => {
    if (!ac) {
      setData(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/kgis/election/Election.asmx/GetAC_CandidateDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ ac_code: ac }),
      });

      const text = await res.text();
      console.log("RAW TEXT:", text);

      // First parse outermost JSON (asmx normally returns a JSON string)
      let first;
      try {
        first = JSON.parse(text);
      } catch (e) {
        // If can't parse, try treating text itself as direct data
        first = text;
      }

      const unwrapped = unwrapResponse(first);
      console.log("UNWRAPPED:", unwrapped);

      const arr = Array.isArray(unwrapped) ? unwrapped : [unwrapped];
      // If arr contains objects like { d: "..." } still, try to map/unpack each element
      const final = arr.map((item) => {
        if (item && typeof item === "object" && typeof item.d === "string") {
          try {
            return JSON.parse(item.d);
          } catch {
            return item;
          }
        }
        return item;
      }).flat(); // flatten in case inner parse returned array

      console.log("FINAL CANDIDATE ARRAY:", final);

      // final should now be an array of candidate objects
      setData(final);
    } catch (err) {
      console.error("fetch/parsing error:", err);
      setError("Failed to fetch or parse data");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2>Assembly Constituency Candidate Details</h2>

      <select
        value={selectedAC}
        onChange={(e) => {
          const ac = e.target.value;
          setSelectedAC(ac);
          getCandidateDetails(ac);
        }}
        style={{ padding: 8, fontSize: 14 }}
      >
        <option value="">-- Select Constituency --</option>
        {karnatakaConstituencies.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.id} - {c.constituency}
          </option>
        ))}
      </select>

      <hr />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !data && <p>No data yet.</p>}

      {!loading &&
        data &&
        data.length > 0 &&
        data.map((c, idx) => {
          // If c is still an array (rare), take first element
          const candidate = Array.isArray(c) ? c[0] : c;
          if (!candidate || typeof candidate !== "object") return null;

          return (
            <div
              key={candidate.Candidate_No ?? idx}
              style={{
                border: "1px solid #eee",
                padding: 12,
                marginBottom: 12,
                borderRadius: 8,
              }}
            >
              <h3 style={{ margin: 0 }}>
                {candidate.Candidate_Name}{" "}
                <small style={{ fontWeight: 400 }}>({candidate.Party_Name})</small>
              </h3>

              <p style={{ margin: "6px 0" }}>
                <strong>AC:</strong> {candidate.AC_Name}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Age:</strong> {candidate.Age} &nbsp; <strong>Sex:</strong>{" "}
                {candidate.Sex}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Reservation:</strong> {candidate.Reservation}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Symbol:</strong> {candidate.Symbol}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Qualification:</strong> {candidate.Qualification}
              </p>

              {candidate.Candidate_Photo && (
                <img
                  src={`data:image/jpeg;base64,${candidate.Candidate_Photo}`}
                  alt={candidate.Candidate_Name}
                  style={{ width: 150, height: "auto", borderRadius: 6, marginTop: 8 }}
                />
              )}
            </div>
          );
        })}
    </div>
  );
}
