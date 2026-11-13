"""Print a summary of a .glb file: size, bounds, triangles, materials, textures."""
import sys
import bpy
from mathutils import Vector

path = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
tris = 0
for o in meshes:
    o.data.calc_loop_triangles()
    tris += len(o.data.loop_triangles)
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
print("OBJECTS", len(bpy.data.objects), "MESHES", len(meshes), "TRIS", tris)
print("BOUNDS lo", [round(v, 3) for v in lo], "hi", [round(v, 3) for v in hi], "size", [round(v, 3) for v in hi - lo])
print("MATERIALS", len(bpy.data.materials), [m.name for m in bpy.data.materials][:40])
print("IMAGES", [(i.name, tuple(i.size)) for i in bpy.data.images][:40])
print("TOP", [(o.name, o.type) for o in bpy.data.objects if o.parent is None][:20])
big = sorted(meshes, key=lambda o: -len(o.data.loop_triangles))[:12]
print("BIGGEST", [(o.name, len(o.data.loop_triangles)) for o in big])
print("ANIMS", len(bpy.data.actions))
