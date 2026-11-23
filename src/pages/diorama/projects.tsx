import type { ReactElement } from 'react';
import ProjectsPanel from '@/diorama/ProjectsPanel';
import RoomLayout from '@/diorama/RoomLayout';

/**
 * The projects page inside the room: the camera glides to the desk, the
 * projects float above it as small models, and the panel beside them shows the
 * chosen project. The plain version is still at /projects.
 */
export default function RoomProjectsPage() {
  return <ProjectsPanel />;
}

RoomProjectsPage.getLayout = (page: ReactElement) => <RoomLayout>{page}</RoomLayout>;
