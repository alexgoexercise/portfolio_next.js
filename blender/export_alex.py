"""
Exports Alex for the web: lying in the bed, with his skeleton and two poses.

Needs the MPFB add-on and its system assets pack installed in Blender.
Run from the repo root:
    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python blender/export_alex.py

Writes public/models/alex.glb containing:
  - animation clips "Asleep" and "Awake" (single poses; the site blends between them),
  - eyelid shapes "eye-left-closure" and "eye-right-closure" on his body,
  - his glasses as a separate part named Alex_Glasses.
Hair and clothes are exported in their original colours; the site darkens them.
"""
import math
import os
import sys

import bmesh
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from alex import set_visible  # noqa: E402
from alex_human import add_glasses, build_alex_human, pose_asleep, pose_awake, reset_pose, set_eyes_closed  # noqa: E402
from build_room import ALEX_IN_BED, BED_POS  # noqa: E402

MAX_TEXTURE = 1024


def remove_hidden_geometry(obj):
    """Delete what the Mask modifiers hide (MakeHuman's helper shapes, skin under clothes)."""
    for mod in [m for m in obj.modifiers if m.type == "MASK"]:
        group = obj.vertex_groups.get(mod.vertex_group)
        if group is not None:
            inside = set()
            for v in obj.data.vertices:
                if any(g.group == group.index and g.weight > 0 for g in v.groups):
                    inside.add(v.index)
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            doomed = [v for v in bm.verts if (v.index in inside) == mod.invert_vertex_group]
            bmesh.ops.delete(bm, geom=doomed, context="VERTS")
            bm.to_mesh(obj.data)
            bm.free()
        obj.modifiers.remove(mod)


def record_pose(rig, name):
    """Store the rig's current pose as a short animation clip."""
    action = bpy.data.actions.new(name)
    rig.animation_data.action = action
    for frame in (1, 24):
        for b in rig.pose.bones:
            b.keyframe_insert("rotation_quaternion", frame=frame)
            b.keyframe_insert("location", frame=frame)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, action)
    rig.animation_data.action = None


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    alex = build_alex_human(skin_type="GAMEENGINE")
    from bl_ext.user_default.mpfb.services.targetservice import TargetService  # only importable once the add-on is enabled

    body, rig = alex["body"], alex["rig"]
    alex["glasses"] = add_glasses(alex)

    # Freeze his body shape, leaving only the eyelid shapes adjustable
    TargetService.bake_targets(body)
    set_eyes_closed(alex, 0.0)

    remove_hidden_geometry(body)
    alex["frozen"] = True
    for o in alex["objects"]:
        if o.type == "MESH":
            for mod in [m for m in o.modifiers if m.type == "SUBSURF"]:
                o.modifiers.remove(mod)

    rig.animation_data_create()
    for name, pose in (("Asleep", pose_asleep), ("Awake", pose_awake)):
        pose(alex)
        record_pose(rig, name)
    reset_pose(alex)
    pose_asleep(alex)
    set_eyes_closed(alex, 0.0)  # the site drives the eyelids itself
    set_visible(alex["glasses"], True)

    # Same spot in the room as in build_room.py
    rig.location = tuple(a + b for a, b in zip(BED_POS, ALEX_IN_BED))
    rig.rotation_euler = (math.radians(-90), 0, 0)

    for image in bpy.data.images:
        w, h = image.size
        if max(w, h) > MAX_TEXTURE:
            k = MAX_TEXTURE / max(w, h)
            image.scale(max(1, int(w * k)), max(1, int(h * k)))

    out = os.path.join(REPO, "public", "models", "alex.glb")
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", export_image_format="WEBP", export_image_quality=85,
        export_draco_mesh_compression_enable=True, export_animation_mode="NLA_TRACKS",
    )
    print("DONE", out, round(os.path.getsize(out) / 1e6, 2), "MB")


if __name__ == "__main__":
    main()
