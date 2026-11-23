import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { chosenSlug } from "./projectsView";

// three.js needs the browser, so the scene is never rendered on the server.
const DioramaScene = dynamic(() => import("./DioramaScene"), { ssr: false });

/**
 * The page layout shared by every page that lives inside the room
 * (/diorama and /diorama/projects).
 *
 * Next.js keeps a layout mounted while you move between pages that use it, so
 * the 3D scene is loaded once and stays: moving from the bedroom to the
 * projects page does not reload it, the camera just glides. Each page supplies
 * its own text and controls, which are drawn on top as `children`.
 *
 * The slider panel shows in local development, or anywhere with ?edit=1.
 */
export default function RoomLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  // The scene only exists in the browser; drawing it after mount keeps the first render identical to the server's
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const editable =
    process.env.NODE_ENV === "development" || router.query.edit === "1";
  const mode = router.pathname === "/diorama/projects" ? "projects" : "hub";
  const initialSpot =
    typeof router.query.at === "string" ? router.query.at : undefined;

  // The chosen project is kept in the address, so it can be shared and the back button works
  const onPickProject = useCallback(
    (slug: string) => {
      void router.replace(
        { pathname: "/diorama/projects", query: { project: slug } },
        undefined,
        { shallow: true, scroll: false },
      );
    },
    [router],
  );

  return (
    <>
      {mounted && (
        <DioramaScene
          editable={editable}
          initialSpot={initialSpot}
          mode={mode}
          projectSlug={chosenSlug(router.query.project)}
          onPickProject={onPickProject}
        />
      )}
      {children}
    </>
  );
}
