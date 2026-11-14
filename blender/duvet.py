"""
The duvet, draped by Blender's cloth simulation.

A flat sheet is dropped onto the bed twice: once with Alex lying asleep, once
with him sat up and the sheet pushed down toward his feet. Each settled shape
is frozen. The asleep drape becomes the mesh, and the awake drape is stored on
it as a shape key called "Awake", so the site can slide between the two.

The simulation runs once here, at build time. Nothing is simulated in the
browser.
"""

import bpy

from lib import M, mat, PALETTE

# Sheet size and placement, in the bed's own coordinates (metres).
# x runs across the bed (negative = wall side), y along it (positive = pillow end).
WALL_SIDE = -0.46  # stops just inside the mattress edge: the wall is right there, so nothing hangs on that side
ROOM_SIDE = 0.66  # hangs a hand's width down the open side of the bed
FOOT_END = -1.02
CHEST_END = 0.56  # pulled up to his shoulders while he sleeps
PUSHED_DOWN = 0.46  # how far it slides toward his feet when he sits up
DROP_HEIGHT = 0.93  # where the sheet starts, just above the sleeper
CELL = 0.024  # size of one square of the sheet; smaller drapes finer but simulates slower
THICKNESS = 0.045
FRAMES = 45  # the sheet lands and stops moving in about 15; the rest is margin


def _grid(name, x0, x1, y0, y1, z):
    """A flat sheet of quads, smooth-shaded."""
    nx = max(2, round((x1 - x0) / CELL))
    ny = max(2, round((y1 - y0) / CELL))
    verts = [(x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny, z) for j in range(ny + 1) for i in range(nx + 1)]
    faces = []
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    for poly in mesh.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def _add_cloth(ob):
    cloth = ob.modifiers.new("Cloth", "CLOTH")
    s = cloth.settings
    s.quality = 10
    s.mass = 0.35
    # A duvet is heavier and stiffer to bend than a bedsheet, so it makes
    # broad soft folds rather than fine wrinkles
    s.tension_stiffness = 18
    s.compression_stiffness = 18
    s.shear_stiffness = 6
    s.bending_stiffness = 2.2
    s.air_damping = 5.0  # a slow, heavy fall, so it settles where it lands
    c = cloth.collision_settings
    c.use_collision = True
    c.collision_quality = 4
    c.distance_min = 0.014
    # Self-collision is off on purpose: with it on, the sheet crumpled into
    # itself and crept toward the foot of the bed instead of settling.
    c.use_self_collision = False
    cloth.point_cache.frame_start = 1
    cloth.point_cache.frame_end = FRAMES
    # Thickness and smoothing sit after the cloth, so both drapes get them identically
    solid = ob.modifiers.new("Thickness", "SOLIDIFY")
    solid.thickness = THICKNESS
    solid.offset = 1.0  # grow upward, away from the body underneath
    smooth = ob.modifiers.new("Smooth", "SUBSURF")
    smooth.levels = 1
    smooth.render_levels = 1


def _make_solid(objects):
    """Let the cloth collide with these. Returns the modifiers added, for removal afterwards."""
    added = []
    for o in objects:
        if o.type != "MESH" or any(m.type == "COLLISION" for m in o.modifiers):
            continue
        mod = o.modifiers.new("Collision", "COLLISION")
        o.collision.thickness_outer = 0.018
        o.collision.cloth_friction = 80  # as grippy as it goes, so the duvet stays where it lands
        o.collision.damping = 1.0
        added.append((o, mod))
    return added


def _drape(ob):
    """Run the simulation and return the settled, thickened shape as a new mesh."""
    scene = bpy.context.scene
    for frame in range(1, FRAMES + 1):
        scene.frame_set(frame)
    deps = bpy.context.evaluated_depsgraph_get()
    return bpy.data.meshes.new_from_object(ob.evaluated_get(deps))


def build_duvet(bed, alex, pose_asleep, pose_awake):
    """
    Build the duvet over Alex in his bed. Leaves Alex in his asleep pose.
    Returns the finished object, named "Duvet", with an "Awake" shape key.
    """
    scene = bpy.context.scene
    bx, by, _ = bed.location

    # Everything the sheet can land on: the bed itself, the sleeper, and a
    # stand-in for the floor
    bedding = [c for c in bed.children if c.name.split(".")[0] in ("Mattress", "Frame", "Pillow", "Headboard")]
    sleeper = [alex["body"], *[alex["parts"][k] for k in ("clothes",) if k in alex["parts"]]]
    floor = _grid("Duvet_Floor", bx - 1.5, bx + 2.5, by - 2.5, by + 1.5, 0.0)
    solids = _make_solid([*bedding, *sleeper, floor])

    def simulate(name, slide):
        sheet = _grid(name, bx + WALL_SIDE, bx + ROOM_SIDE, by + FOOT_END - slide, by + CHEST_END - slide, DROP_HEIGHT)
        _add_cloth(sheet)
        scene.frame_set(1)
        mesh = _drape(sheet)
        bpy.data.objects.remove(sheet, do_unlink=True)
        return mesh

    pose_asleep(alex)
    asleep = simulate("Duvet_Sim_Asleep", 0.0)
    pose_awake(alex)
    awake = simulate("Duvet_Sim_Awake", PUSHED_DOWN)
    pose_asleep(alex)
    scene.frame_set(1)

    for o, mod in solids:
        o.modifiers.remove(mod)
    bpy.data.objects.remove(floor, do_unlink=True)

    if len(asleep.vertices) != len(awake.vertices):
        raise RuntimeError("The two duvet drapes do not match, so they cannot be blended.")

    asleep.name = "Duvet"
    duvet = bpy.data.objects.new("Duvet", asleep)
    scene.collection.objects.link(duvet)
    duvet.shape_key_add(name="Basis")
    key = duvet.shape_key_add(name="Awake")
    coords = [0.0] * (len(awake.vertices) * 3)
    awake.vertices.foreach_get("co", coords)
    key.data.foreach_set("co", coords)
    key.value = 0.0  # Blender switches a new shape key fully on; he starts asleep
    bpy.data.meshes.remove(awake)

    asleep.materials.append(M("duvet", rough=0.95))
    return duvet


def set_duvet_awake(duvet, amount):
    """0 = pulled up over him, 1 = pushed down."""
    duvet.data.shape_keys.key_blocks["Awake"].value = amount


def export_duvet(duvet, path):
    """
    Write the duvet as its own web file. Its fabric texture is a Blender-only
    effect, so a plain version of the material is swapped in for the export.
    """
    web = mat("duvet_web", PALETTE["duvet"], rough=0.92)
    original = duvet.data.materials[0]
    duvet.data.materials[0] = web
    for o in bpy.context.view_layer.objects:
        o.select_set(o is duvet)
    bpy.context.view_layer.objects.active = duvet
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True,
        export_draco_mesh_compression_enable=True, export_animations=False,
    )
    duvet.data.materials[0] = original
