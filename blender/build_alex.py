"""
Builds the realistic Alex on his own, for a character sheet.

Needs the MPFB add-on and its system assets pack installed in Blender.
Run from the repo root (note: no --factory-startup, so the add-on is found):
    /Applications/Blender.app/Contents/MacOS/Blender --background --python blender/build_alex.py

Outputs:
    blender/alex.blend
    blender/renders/alex_sheet.png, alex_face.png
"""

import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from alex_human import build_alex_human, pose_standing, style_alex  # noqa: E402
from build_room import add_camera, render, setup_render  # noqa: E402
from lib import cyl, look_at, mat, srgb  # noqa: E402


def area_light(name, loc, target, color, watts, size):
    data = bpy.data.lights.new(name, "AREA")
    data.color = srgb(color)[:3]
    data.energy = watts
    data.size = size
    ob = bpy.data.objects.new(name, data)
    ob.location = loc
    bpy.context.scene.collection.objects.link(ob)
    look_at(ob, target)
    return ob


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    for x, turn in ((-0.6, 0.0), (0.6, 0.75)):
        alex = style_alex(build_alex_human())
        pose_standing(alex)
        alex["rig"].location.x = x
        alex["rig"].rotation_euler.z = turn

    cyl("Floor", 4.0, 0.02, (0, 0, -0.01), mat("studio_floor", "#cbb89a", rough=0.9), segments=64)
    world = bpy.data.worlds.new("Studio")
    try:
        world.use_nodes = True
    except Exception:
        pass
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs[0].default_value = srgb("#cbb89a")
        bg.inputs[1].default_value = 0.6
    scene.world = world
    area_light("Key", (2.0, -3.0, 3.0), (0, 0, 0.9), "#ffe2c2", 500, 2.5)
    area_light("Fill", (-3.0, -2.0, 1.5), (0, 0, 0.9), "#c9d6ff", 150, 3.0)

    sheet = add_camera("Cam_Sheet", (0, -5.6, 1.1), (0, 0, 0.85), lens=70)
    face_cam = add_camera("Cam_Face", (-0.4, -1.15, 1.52), (-0.6, 0, 1.47), lens=70)

    setup_render()
    scene.camera = sheet
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "alex.blend"))
    render(sheet, "alex_sheet.png")
    render(face_cam, "alex_face.png")
    print("DONE alex")


if __name__ == "__main__":
    main()
