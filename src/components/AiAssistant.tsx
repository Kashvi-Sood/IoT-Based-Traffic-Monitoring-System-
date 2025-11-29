// src/components/AiAssistantChat.tsx
import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { SensorReading } from "../types";

interface Station {
  id: string | number;
  info: {
    name: string;
    latitude: number;
    longitude: number;
    area: string;
  };
  latestReading: SensorReading | null;
}

interface Suggestion {
  stationName: string;
  area: string;
  parameter: "Temperature" | "PM 2.5 Emissions" | "Noise";
  value: number;
  threshold: number;
  suggestion: string;
}

interface AiAssistantChatProps {
  stations: Station[];
}

const AiAssistantChat: React.FC<AiAssistantChatProps> = ({ stations }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setChatOpen((prev) => !prev);

  const analyzeStationsWithAI = async (stations: Station[]) => {
    setLoading(true);
    setSuggestions([]);

    let finalSuggestions: Suggestion[] = [];

    try {
      const response = await fetch("/api/analyzeStations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stations }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const apiData = await response.json();

      if (Array.isArray(apiData) && apiData[0]?.stationName) {
        finalSuggestions = apiData as Suggestion[];
      } else {
        const content = apiData.choices?.[0]?.message?.content || "";
        const cleanContent = content.replace(/```json|```/g, "").trim();
        try {
          finalSuggestions = JSON.parse(cleanContent);
        } catch {
          finalSuggestions = [];
        }
      }
    } catch {
      finalSuggestions = [];
    }

    if (finalSuggestions.length === 0) {
      finalSuggestions = stations
        .map((s) => {
          if (s.latestReading?.temperature! > 30)
            return {
              stationName: s.info.name,
              area: s.info.area,
              parameter: "Temperature",
              value: s.latestReading?.temperature!,
              threshold: 30,
              suggestion: "Deploy cooling systems or improve ventilation.",
            };
          if (s.latestReading?.emissions! > 150)
            return {
              stationName: s.info.name,
              area: s.info.area,
              parameter: "PM 2.5 Emissions",
              value: s.latestReading?.emissions!,
              threshold: 150,
              suggestion:
                "Implement carbon capture technologies or reduce operational hours.",
            };
          if (s.latestReading?.noise! > 85)
            return {
              stationName: s.info.name,
              area: s.info.area,
              parameter: "Noise",
              value: s.latestReading?.noise!,
              threshold: 85,
              suggestion:
                "Install noise barriers or schedule loud activities during off-peak hours.",
            };
          return null;
        })
        .filter(Boolean) as Suggestion[];
    }

    setSuggestions(finalSuggestions);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Get Assistance Button */}
      {!chatOpen && (
        <Button
          variant="contained"
          onClick={toggleChat}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            borderRadius: "50px",
            backgroundColor: "var(--accent)",
            color: "white",
            "&:hover": { backgroundColor: "var(--accent-light)" },
            zIndex: 1000,
          }}
        >
          Get Assistance
        </Button>
      )}

      {/* Chat Panel */}
      {chatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            right: 24,
            width: suggestions.length > 0 ? 480 : 360,
            maxHeight: suggestions.length > 0 ? "100vh" : "70vh",
            bgcolor: "var(--bg-surface)",
            borderRadius: "12px 12px 0 0",
            border: "1px solid var(--border-soft)",
            boxShadow: "var(--shadow-mid)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            transition: "all 0.3s ease-in-out",
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderBottom: "1px solid var(--border-soft)",
              bgcolor: "var(--bg-surface-alt)",
            }}
          >
            <Typography sx={{ fontWeight: "bold", color: "var(--accent)" }}>
              AI Assistant
            </Typography>

            <IconButton size="small" onClick={toggleChat}>
              <CloseIcon sx={{ color: "var(--text-primary)" }} />
            </IconButton>
          </Box>

          {/* Chat Content */}
          <Box
            sx={{
              p: 2,
              overflowY: "auto",
              flexGrow: 1,
              color: "var(--text-primary)",
            }}
          >
            {suggestions.length === 0 && !loading && (
              <Typography sx={{ color: "var(--text-secondary)" }}>
                Click "Analyze" to get mitigation strategies and suggestions.
              </Typography>
            )}

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <CircularProgress color="inherit" size={24} />
              </Box>
            )}

            {suggestions.length > 0 &&
              Object.entries(
                suggestions.reduce(
                  (acc: Record<string, Suggestion[]>, curr) => {
                    if (!acc[curr.stationName]) acc[curr.stationName] = [];
                    acc[curr.stationName].push(curr);
                    return acc;
                  },
                  {}
                )
              ).map(([stationName, stationSuggestions]) => {
                const area = stationSuggestions[0]?.area || "";
                return (
                  <Box
                    key={stationName}
                    sx={{
                      mt: 2,
                      p: 1.5,
                      backgroundColor: "var(--bg-surface-alt)",
                      borderRadius: "10px",
                      border: "1px solid var(--border-soft)",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        color: "var(--text-primary)",
                      }}
                    >
                      {stationName} {area && `- ${area}`}
                    </Typography>

                    {stationSuggestions.map((s, idx) => (
                      <Box key={idx} sx={{ mt: 0.5 }}>
                        <Typography>
                          <strong>Parameter:</strong> {s.parameter}
                        </Typography>
                        <Typography>
                          <strong>Value:</strong> {s.value} (Threshold:{" "}
                          {s.threshold})
                        </Typography>
                        <Typography>
                          <strong>Suggestion:</strong> {s.suggestion}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })}
          </Box>

          {/* Analyze Button */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid var(--border-soft)",
              bgcolor: "var(--bg-surface-alt)",
            }}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={() => analyzeStationsWithAI(stations)}
              disabled={loading}
              sx={{
                backgroundColor: "var(--accent)",
                "&:hover": { backgroundColor: "var(--accent-light)" },
                color: "white",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Analyze"
              )}
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};

export default AiAssistantChat;
