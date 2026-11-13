"""
Exports the drum kit, already positioned on the rug, as a slimmed-down web file.

Run from the repo root, after build_room.py:
    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python blender/export_kit.py

The Drumstructor kit is 31 MB with about 490,000 triangles in 311 parts, which
is far too heavy for a web page. This script:
  - thins out dense parts (lugs, hoops, screws) that are tiny on screen,
  - merges look-alike materials and joins everything into one object,
  - shrinks textures to 1024 px,
  - writes a compressed file to public/models/drumkit.glb.
"""
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
MAX_TEXTURE = 1024


def under(obj, name):
    while obj is not None:
        if obj.name == name:
            return True
        obj = obj.parent
    return False


def principled(material):
    if material is None or material.node_tree is None:
        return None
    return next((n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def signature(material):
    """Materials with the same signature look the same and can share one slot."""
    node = principled(material)
    if node is None:
        return ("other", material.name if material else None)
    parts = []
    for key in ("Base Color", "Metallic", "Roughness", "Alpha", "Normal", "Emission Color"):
        sock = node.inputs.get(key)
        if sock is None:
            continue
        if sock.is_linked:
            src = sock.links[0].from_node
            image = getattr(src, "image", None)
            if image is None and src.type == "NORMAL_MAP" and src.inputs["Color"].is_linked:
                image = getattr(src.inputs["Color"].links[0].from_node, "image", None)
            parts.append((key, "tex", image.name if image else src.name))
        else:
            value = sock.default_value
            value = tuple(round(v, 2) for v in value) if hasattr(value, "__len__") else round(value, 2)
            parts.append((key, value))
    return tuple(parts)


bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "room.blend"))
scene = bpy.context.scene
for o in [o for o in scene.objects if not under(o, "DrumKit")]:
    bpy.data.objects.remove(o, do_unlink=True)

meshes = [o for o in scene.objects if o.type == "MESH"]
before = 0
for o in meshes:
    o.data.calc_loop_triangles()
    tris = len(o.data.loop_triangles)
    before += tris
    ratio = 0.18 if tris > 6000 else 0.3 if tris > 2000 else 0.55 if tris > 600 else 1.0
    if ratio < 1.0:
        mod = o.modifiers.new("Thin", "DECIMATE")
        mod.ratio = ratio

# Bake the thinning in, then merge look-alike materials
deps = bpy.context.evaluated_depsgraph_get()
for o in meshes:
    if o.modifiers:
        mesh = bpy.data.meshes.new_from_object(o.evaluated_get(deps))
        o.modifiers.clear()
        o.data = mesh
canonical = {}
for o in meshes:
    for slot in o.material_slots:
        if slot.material is not None:
            slot.material = canonical.setdefault(signature(slot.material), slot.material)

# One object instead of 311
for o in bpy.context.view_layer.objects:
    o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
kit = meshes[0]
kit.name = "DrumKit_mesh"
kit.data.calc_loop_triangles()
after = len(kit.data.loop_triangles)

for image in bpy.data.images:
    w, h = image.size
    if max(w, h) > MAX_TEXTURE:
        k = MAX_TEXTURE / max(w, h)
        image.scale(max(1, int(w * k)), max(1, int(h * k)))

out = os.path.join(REPO, "public", "models", "drumkit.glb")
bpy.ops.export_scene.gltf(
    filepath=out, export_format="GLB", export_image_format="WEBP", export_image_quality=85,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
)
print("DONE", out, round(os.path.getsize(out) / 1e6, 2), "MB;", before, "->", after, "triangles;",
      len(canonical), "materials")
