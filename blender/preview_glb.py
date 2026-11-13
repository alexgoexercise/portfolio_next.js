"""Render two quick previews (three-quarter and top) of a .glb, to check its scale and facing."""
import os, sys
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_room import add_camera, render, setup_render  # noqa: E402
from lib import srgb  # noqa: E402

path = sys.argv[sys.argv.index("--") + 1]
scale = float(sys.argv[sys.argv.index("--") + 2])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)
root = [o for o in bpy.data.objects if o.parent is None][0]
root.scale = (scale,) * 3
bpy.context.view_layer.update()
lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
for o in bpy.data.objects:
    if o.type == "MESH":
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
c = (lo + hi) / 2
print("SCALED lo", [round(v, 2) for v in lo], "hi", [round(v, 2) for v in hi])
world = bpy.data.worlds.new("W"); world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = srgb("#b8b0a4"); bg.inputs[1].default_value = 1.0
bpy.context.scene.world = world
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN")); sun.data.energy = 3
sun.rotation_euler = (0.7, 0.2, 0.6); bpy.context.scene.collection.objects.link(sun)
setup_render()
bpy.context.scene.cycles.samples = 32
bpy.context.scene.render.resolution_percentage = 60
r = max(hi - lo)
render(add_camera("A", (c.x + r * 1.1, c.y - r * 1.3, c.z + r * 0.9), c, 50), "kit_preview_front.png")
render(add_camera("B", (c.x, c.y - 0.01, c.z + r * 2.2), c, 50), "kit_preview_top.png")
