import { projects, type Project } from '@/content/projects';

/** URL-friendly name of a project: "AR Laser Tag++" becomes "ar-laser-tag". */
export function projectSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/\+/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface RoomProject {
  slug: string;
  project: Project;
}

/**
 * The projects shown in the room, in the order they appear in
 * src/content/projects.ts. Adding a project there adds it here too; it gets a
 * plain placeholder model until one is added in ProjectProps.tsx.
 */
export const roomProjects: RoomProject[] = projects.map((project) => ({
  slug: projectSlug(project.title),
  project,
}));

/** The slug to show: the one in the address if it exists, otherwise the first project. */
export function chosenSlug(fromAddress: string | string[] | undefined) {
  const wanted = typeof fromAddress === 'string' ? fromAddress : undefined;
  return roomProjects.some((p) => p.slug === wanted) ? (wanted as string) : roomProjects[0].slug;
}
