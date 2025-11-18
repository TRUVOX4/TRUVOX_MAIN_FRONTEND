// ACDetails.jsx
import { useState } from "react";
import { parliamentaryConstituencies } from "../../data/constituencies";

/**
 * NOTE:
 * - The endpoint sometimes expects a specific parameter name in body.
 * - I used { ac_code: ac } as the request body (same pattern as other endpoint).
 * - If the API expects a different key (e.g. pc_code, PC_ID, or constituency id),
 *   change the body line labeled "CHANGE HERE" below accordingly.
 */

export default function ACDetails() {
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState(null); // normalized array of result objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const unwrapResponse = (value) => {
    // Recursively unwrap known wrapper patterns until stable
    let parsed = value;
    let safety = 0;
    while (safety++ < 15) {
      // pattern: [{ d: "..." }]
      if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] && typeof parsed[0].d === "string") {
        try {
          parsed = JSON.parse(parsed[0].d);
          continue;
        } catch (e) {
          break;
        }
      }

      // pattern: { d: "..." }
      if (!Array.isArray(parsed) && parsed && typeof parsed === "object" && typeof parsed.d === "string") {
        try {
          parsed = JSON.parse(parsed.d);
          continue;
        } catch (e) {
          break;
        }
      }

      // pattern: JSON string
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
          continue;
        } catch {
          break;
        }
      }

      break;
    }
    return parsed;
  };

  const fetchACDetails = async (id) => {
    if (!id) {
      setData(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/kgis/election/Election.asmx/USP_GetACDetails_2023", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        // ---- CHANGE HERE if API expects a different key (pc_code / PC_ID / id etc.)
        body: JSON.stringify({ ac_code: id }),
      });

      const text = await res.text();
      console.log("RAW TEXT (USP_GetACDetails_2023):", text);

      // parse outer
      let first;
      try {
        first = JSON.parse(text);
      } catch (e) {
        first = text;
      }

      const unwrapped = unwrapResponse(first);
      console.log("UNWRAPPED (USP_GetACDetails_2023):", unwrapped);

      // normalize to array
      const arr = Array.isArray(unwrapped) ? unwrapped : [unwrapped];

      // If each item is still like { d: "..." } parse inner items and flatten
      const final = arr
        .map((item) => {
          if (item && typeof item === "object" && typeof item.d === "string") {
            try {
              return JSON.parse(item.d);
            } catch {
              return item;
            }
          }
          return item;
        })
        .flat();

      console.log("FINAL AC DETAILS ARRAY:", final);
      setData(final);
    } catch (err) {
      console.error("fetch/parsing error (USP_GetACDetails_2023):", err);
      setError("Failed to fetch or parse data");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Generic renderer: shows object keys + values (handles nested arrays/objects)
  const renderValue = (v) => {
    if (v == null) return <em>null</em>;
    if (Array.isArray(v)) return (
      <ul style={{ margin: 4 }}>
        {v.map((x, i) => <li key={i} style={{ fontSize: 13 }}>{renderValue(x)}</li>)}
      </ul>
    );
    if (typeof v === "object") {
      return (
        <div style={{ paddingLeft: 8 }}>
          {Object.entries(v).map(([k, val]) => (
            <div key={k} style={{ fontSize: 13 }}>
              <strong>{k}:</strong> {renderValue(val)}
            </div>
          ))}
        </div>
      );
    }
    return String(v);
  };

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2>AC Details (2023)</h2>

      <select
        value={selectedId}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedId(id);
          fetchACDetails(id);
        }}
        style={{ padding: 8, fontSize: 14 }}
      >
        <option value="">-- Select (PC / ID) --</option>
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
            {data.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #eee",
                  padding: 12,
                  marginBottom: 12,
                  borderRadius: 8,
                }}
              >
                {/* If item is an array, flatten first */}
                {Array.isArray(item)
                  ? item.map((it, i) => (
                      <div key={i}>
                        {typeof it === "object" ? (
                          <div>
                            {Object.entries(it).map(([k, v]) => (
                              <div key={k}><strong>{k}:</strong> {renderValue(v)}</div>
                            ))}
                          </div>
                        ) : (
                          <div>{String(it)}</div>
                        )}
                      </div>
                    ))
                  : typeof item === "object"
                  ? (
                      <div>
                        {Object.entries(item).map(([k, v]) => (
                          <div key={k} style={{ marginBottom: 6 }}>
                            <strong>{k}:</strong> {renderValue(v)}
                          </div>
                        ))}
                      </div>
                    )
                  : <div>{String(item)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
