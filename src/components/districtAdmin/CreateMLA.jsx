import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { karnatakaConstituencies } from "../../data/constituencies";

const CreateMLA = () => {
  const navigate = useNavigate();

  const [electionType] = useState("MLA Election"); // auto-filled, read-only
  const [stateName, setStateName] = useState("Karnataka"); // default to Karnataka
  const [district, setDistrict] = useState("");
  const [electionDate, setElectionDate] = useState("");
  const [constituency, setConstituency] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // -------------------------------------
  // unwrap ASMX response (robust unwrapping)
  // -------------------------------------
  const unwrapResponse = (value) => {
    let parsed = value;
    let safety = 0;

    while (safety++ < 15) {
      if (Array.isArray(parsed) && parsed.length === 1 && parsed[0]?.d) {
        try {
          parsed = JSON.parse(parsed[0].d);
          continue;
        } catch {}
      }

      if (parsed && typeof parsed === "object" && parsed.d) {
        try {
          parsed = JSON.parse(parsed.d);
          continue;
        } catch {}
      }

      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
          continue;
        } catch {}
      }

      break;
    }
    return parsed;
  };

  // -------------------------------------
  // normalize base64 photo -> returns full data URL or null
  // -------------------------------------
  const normalizeBase64Photo = (raw) => {
    if (!raw) return null;

    // If it's already a data URL, try to extract the base64 part
    if (typeof raw === "string" && raw.startsWith("data:")) {
      const comma = raw.indexOf(",");
      if (comma !== -1) raw = raw.slice(comma + 1);
    }

    // Convert to string and remove whitespace/newlines
    let s = String(raw).replace(/\s+/g, "");

    // Basic validation
    const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(s);
    if (!maybeBase64 || s.length < 80) return null;

    return `data:image/jpeg;base64,${s}`;
  };

  // -------------------------------------
  // Fetch candidate details and fill candidates[] (symbol text only, photo robust)
  // -------------------------------------
  const getCandidateDetails = async (acCode) => {
    setCandidates([]);
    if (!acCode) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/kgis/election/Election.asmx/GetAC_CandidateDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ ac_code: acCode }),
      });

      const text = await res.text();

      // parse outer JSON if possible
      let first;
      try {
        first = JSON.parse(text);
      } catch {
        first = text;
      }

      const unwrapped = unwrapResponse(first);
      let arr = Array.isArray(unwrapped) ? unwrapped : [unwrapped];
      arr = arr.flat ? arr.flat() : [].concat(...arr);

      const final = arr
        .map((c) => {
          if (!c || typeof c !== "object") return null;

          const name = c.Candidate_Name || "";
          const party = c.Party_Name || "";

          // symbol: take the portion before ":" (e.g. "Lotus:1" -> "Lotus")
          const rawSymbol = c.Symbol ?? c.Symbol_Name ?? "";
          const symbol = String(rawSymbol).split(":")[0];

          // candidate photo: robust normalization & validation
          let photo_url = null;
          let rawBase64 = "";
          if (c.Candidate_Photo) {
            // If it's a data URL, remove prefix and validate
            let maybe = c.Candidate_Photo;
            if (typeof maybe === "string" && maybe.startsWith("data:")) {
              const comma = maybe.indexOf(",");
              if (comma !== -1) maybe = maybe.slice(comma + 1);
            }
            const cleaned = String(maybe).replace(/\s+/g, "");
            if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length >= 80) {
              photo_url = `data:image/jpeg;base64,${cleaned}`;
              rawBase64 = cleaned;
            } else {
              // try normalize helper
              const normalized = normalizeBase64Photo(c.Candidate_Photo);
              if (normalized) {
                photo_url = normalized;
                rawBase64 = String(c.Candidate_Photo).replace(/^data:image\/[a-zA-Z]+;base64,/, "").replace(/\s+/g, "");
              } else {
                console.warn("Candidate_Photo not usable as base64 for candidate:", name, c.Candidate_Photo);
              }
            }
          }

          return {
            name,
            party,
            symbol,
            photo_url,
            _photo_base64_raw: rawBase64, // string or ""
          };
        })
        .filter(Boolean);

      setCandidates(final);
    } catch (err) {
      console.error("Failed to fetch/parse KGIS response:", err);
      setError("Failed to load candidate details.");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // handle constituency change: set constituency id, auto-set district from imported data, fetch candidates
  // -------------------------------------
  const onConstituencyChange = (selectedId) => {
    setConstituency(selectedId);

    const found = karnatakaConstituencies.find((c) => String(c.id) === String(selectedId));
    const derivedDistrict = found?.district ?? found?.district_name ?? found?.dist ?? "";
    if (derivedDistrict) setDistrict(String(derivedDistrict));

    getCandidateDetails(selectedId);
  };

  // -------------------------------------
  // handleSubmit: coerce all fields to strings, send raw base64 for photos
  // -------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // map candidates to safe payload: strings only, photo raw base64 in candidate_photo_base64
    const candidatesPayload = candidates.map((c) => ({
      name: String(c.name ?? ""),
      party: String(c.party ?? ""),
      symbol: String(c.symbol ?? ""),
      candidate_photo_base64: String(c._photo_base64_raw ?? ""),
    }));

    const consisName = karnatakaConstituencies[constituency].constituency;

    const payload = {
      election_type: String(electionType ?? ""),
      state: String(stateName ?? ""),
      district: String(district ?? ""),
      election_date: String(electionDate ?? ""),
      constituency: String(consisName ?? ""),
      candidates: candidatesPayload,
    };

    console.log("CreateElection payload:", consisName);

    try {
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
            .map((d) => {
              if (d.loc && d.msg) return `${d.loc.join(" > ")}: ${d.msg}`;
              return JSON.stringify(d);
            })
            .join("; ");
          setError(msg);
        } else {
          setError(JSON.stringify(resp.data));
        }
        console.warn("422 validation:", resp.data);
        return;
      }

      setError(resp.data?.detail || `Server returned status ${resp.status}`);
      console.error("Unexpected response:", resp);
    } catch (err) {
      console.error("Request failed:", err);
      if (err.response) {
        setError(err.response.data?.detail || `Request failed with status ${err.response.status}`);
        console.error("Server response body:", err.response.data);
      } else {
        setError(err.message || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // UI
  // -------------------------------------
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-semibold mb-6 text-center">Create MLA Election</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TOP: Constituency */}
        <div>
          <label className="block mb-1 font-medium">Constituency</label>
          <select
            className="w-full border px-3 py-2 rounded-lg"
            value={constituency}
            onChange={(e) => onConstituencyChange(e.target.value)}
            required
          >
            <option value="">-- Select Constituency --</option>
            {karnatakaConstituencies.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.id} - {c.constituency}
              </option>
            ))}
          </select>
        </div>

        {/* Election Type (read-only) */}
        <div>
          <label className="block mb-1 font-medium">Election Type</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded-lg bg-gray-100"
            value={electionType}
            readOnly
          />
        </div>

        {/* State (disabled) */}
        <div>
          <label className="block mb-1 font-medium">State</label>
          <input
            className="w-full border px-3 py-2 rounded-lg"
            value={stateName}
            required
            disabled
          />
        </div>

        {/* District (auto-filled & disabled) */}
        <div>
          <label className="block mb-1 font-medium">District</label>
          <input
            className="w-full border px-3 py-2 rounded-lg"
            value={district}
            placeholder="Hubballi"
            required
            disabled
          />
        </div>

        {/* Election Date */}
        <div>
          <label className="block mb-1 font-medium">Election Date</label>
          <input
            type="date"
            className="w-full border px-3 py-2 rounded-lg"
            value={electionDate}
            onChange={(e) => setElectionDate(e.target.value)}
            required
          />
        </div>

        {/* Candidates listing */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Candidates</h3>

          {loading && <div className="text-sm text-gray-500 mb-2">Loading candidates…</div>}

          {candidates.length === 0 && !loading && (
            <div className="text-sm text-gray-500 mb-2">No candidates loaded yet.</div>
          )}

          {candidates.map((c, i) => (
            <div key={i} className="border p-3 mb-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-gray-600">{c.party}</div>
                </div>

                {/* Photo (if present and normalized) */}
                {c.photo_url ? (
                  <img
                    src={c.photo_url}
                    alt={`${c.name} photo`}
                    style={{ width: 120, height: "auto", borderRadius: 6 }}
                  />
                ) : (
                  <div style={{ width: 120, height: 80, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid #eee", background: "#fafafa", fontSize: 12 }}>
                    No photo
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-800 mt-1">
                Symbol: <span className="font-semibold">{c.symbol}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mt-2"
        >
          {loading ? "Creating..." : "Create Election"}
        </button>
      </form>

      {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
      {error && <p className="text-red-600 mt-4 text-center whitespace-pre-wrap">{error}</p>}
    </div>
  );
};

export default CreateMLA;
