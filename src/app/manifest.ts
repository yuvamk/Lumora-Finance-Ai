import { MetadataRoute } from "next";
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumora Personal AI Workspace",
    short_name: "Lumora AI",
    description: "Your Secure Personal Developer & Life Assistant Companion",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/globe.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Daily Habits",
        short_name: "Habits",
        description: "Check off your daily rituals",
        url: "/insights?tab=habits",
      },
      {
        name: "Brain Dump Note",
        short_name: "Brain Dump",
        description: "Quickly dump thoughts or ideas",
        url: "/insights?tab=brainDump",
      },
      {
        name: "Well-Being Log",
        short_name: "Well-Being",
        description: "Perform daily mood and energy check-in",
        url: "/insights?tab=wellbeing",
      },
    ],
  };
}
