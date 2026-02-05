import { useEffect } from "react";
import toast from "react-hot-toast";

export function useAnalysisEvents(userId) {
  useEffect(() => {
    if (!userId) return;

    const source = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/api/analysis-events?userId=${userId}`
    );

    source.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "analysis_complete") {
        toast.success(
          `Posture analysis ready: "${data.title || "Untitled Video"}"`
        );
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [userId]);
}
