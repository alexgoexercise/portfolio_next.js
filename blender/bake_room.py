"""
Bakes the room for the web.

The wood grain, fabric and lamp light in room.blend only exist inside Blender.
This script paints all of it into two image textures, so the browser can show
the same look without doing any lighting of its own.

Run from the repo root, after build_room.py:
    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python blender/bake_room.py            (add  -- --quick  for a fast rough pass,
                                                  or  -- --hq  for the sharpest result)

Outputs:
    public/models/room.glb       baked room, textures embedded
    blender/room_baked.blend     the baked scene, to inspect in Blender
    blender/renders/bake_*.png   the baked texture sheets

What it does:
  1. Hides Alex (he moves, so he must not leave a shadow in the bake). The drum
     kit stays, so its shadow lands on the rug, but the kit itself is not baked.
  2. Applies modifiers and joins each piece of furniture into a single mesh,
     named after its group (Bed, Desk, GamingPC, Phone ...) so the site can
     still tell the pieces apart for clicks.
  3. Unwraps everything into two texture sheets: one for the walls and floor,
     one for furniture and props.
  4. Bakes colour and lighting together, applies the same tone curve as the
     renders, and swaps every material for a plain "show this picture" one.
"""

import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
QUICK = "--quick" in sys.argv
HQ = "--hq" in sys.argv  # sharper sheets; takes roughly an hour
SIZE = 1024 if QUICK else (4096 if HQ else 2048)
SAMPLES = 12 if QUICK else (64 if HQ else 32)

NOT_BAKED = ("Alex", "DrumKit")  # these ship as their own files
SEE_THROUGH = ("Glass_",)  # kept as real transparent materials


def under(obj, names):
    """True if obj or any ancestor is one of the named objects."""
    while obj is not None:
        if obj.name in names:
            return True
        obj = obj.parent
    return False


def select_only(objs, active):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active


def apply_modifiers(objs):
    deps = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        if o.modifiers:
            mesh = bpy.data.meshes.new_from_object(o.evaluated_get(deps))
            o.modifiers.clear()
            o.data = mesh


def join_units(meshes):
    """Join meshes that share a parent group into one mesh per group."""
    units = {}
    for o in meshes:
        has_mesh_children = any(c.type == "MESH" for c in o.children)
        if has_mesh_children:
            key = o
        elif o.parent is not None and o.parent.type == "MESH":
            key = o.parent
        else:
            key = o.parent
        units.setdefault(key, []).append(o)

    joined = []
    for key, objs in units.items():
        target = key if (key is not None and key.type == "MESH") else objs[0]
        if len(objs) > 1:
            select_only(objs, target)
            bpy.ops.object.join()
        if key is not None and key.type != "MESH":
            target.name = f"{key.name}_mesh"
        joined.append(target)
    return joined


def unwrap(objs):
    """Give every object a fresh UV map and pack them all into one shared sheet."""
    for o in objs:
        while o.data.uv_layers:
            o.data.uv_layers.remove(o.data.uv_layers[0])
        o.data.uv_layers.new(name="bake")
    select_only(objs, objs[0])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0015)
    bpy.ops.uv.pack_islands(margin=0.0015)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake(objs, name):
    """Bake colour plus lighting for these objects into one image; returns the saved file."""
    scene = bpy.context.scene
    image = bpy.data.images.new(f"bake_{name}", SIZE, SIZE, alpha=False, float_buffer=True)
    for o in objs:
        for slot in o.material_slots:
            nodes = slot.material.node_tree.nodes
            node = nodes.get("BAKE_TARGET") or nodes.new("ShaderNodeTexImage")
            node.name = "BAKE_TARGET"
            node.image = image
            for n in nodes:
                n.select = False
            node.select = True
            nodes.active = node
    select_only(objs, objs[0])
    bpy.ops.object.bake(type="COMBINED", margin=6, use_clear=True)

    # Save through the render pipeline so the bake gets the same tone curve as the renders
    path = os.path.join(HERE, "renders", f"bake_{name}.png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    scene.render.image_settings.file_format = "PNG"
    image.save_render(path, scene=scene)
    return path


def use_baked(objs, name, path):
    """Replace all materials with one that simply shows the baked picture."""
    image = bpy.data.images.load(path)
    m = bpy.data.materials.new(f"baked_{name}")
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    nt.nodes.clear()
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = image
    emit = nt.nodes.new("ShaderNodeEmission")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(tex.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs[0], out.inputs["Surface"])
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(m)
        o.data.polygons.foreach_set("material_index", [0] * len(o.data.polygons))
        o.data.update()


def main():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "room.blend"))
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = True

    # Alex is taken out entirely; the kit stays for its shadow
    # (collect first: removing a parent would hide its children from the check)
    for o in [o for o in scene.objects if under(o, ("Alex",))]:
        bpy.data.objects.remove(o, do_unlink=True)

    meshes = [o for o in scene.objects if o.type == "MESH" and not under(o, NOT_BAKED) and not o.hide_render]
    glass = [o for o in meshes if o.name.startswith(SEE_THROUGH)]
    solid = [o for o in meshes if o not in glass]
    print(f"BAKE {len(solid)} solid meshes, {len(glass)} see-through")

    apply_modifiers(meshes)
    joined = join_units(solid)
    print("UNITS", sorted(o.name for o in joined))

    shell = [o for o in joined if under(o, ("Room",))]
    props = [o for o in joined if o not in shell]
    for name, objs in (("shell", shell), ("props", props)):
        unwrap(objs)
    # Bake both before swapping any material, so each bake sees the real scene
    paths = {name: bake(objs, name) for name, objs in (("shell", shell), ("props", props))}
    for name, objs in (("shell", shell), ("props", props)):
        use_baked(objs, name, paths[name])

    # Everything that is not part of the room file goes
    for o in [o for o in scene.objects if under(o, ("DrumKit",)) or o.type in ("LIGHT", "CAMERA")]:
        bpy.data.objects.remove(o, do_unlink=True)

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "room_baked.blend"))
    out = os.path.join(REPO, "public", "models", "room.glb")
    try:
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_image_format="WEBP", export_image_quality=88)
    except TypeError:
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB")
    tris = sum(len(o.data.polygons) for o in joined)
    print("DONE", out, round(os.path.getsize(out) / 1e6, 2), "MB,", tris, "faces")


if __name__ == "__main__":
    main()
