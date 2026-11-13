"""
Realistic Alex, generated with the MPFB add-on (the MakeHuman body generator).

Needs MPFB and its "MakeHuman system assets" pack installed in Blender; both
are free. This replaces the toy puppet in alex.py for the realistic look.

    alex = build_alex_human()
    alex["rig"]     armature: move, rotate and pose this
    alex["body"]    the body mesh
    alex["parts"]   {"hair": obj, "clothes": obj, "eyes": obj, ...}
"""

import math
import os

import bpy
from mathutils import Matrix, Vector

from alex import build_glasses, set_visible

MPFB = "bl_ext.user_default.mpfb"

# What Alex is made of. Names are assets from the MakeHuman system assets pack.
LOOK = {
    "skin": "young_asian_male",
    "eyes": "low-poly",
    "eyebrows": "eyebrow001",
    "eyelashes": "eyelashes01",
    "teeth": "teeth_base",
    "hair": "short02",
    "clothes": "male_casualsuit06",  # plain tee and jeans; tinted dark below
}

# Body shape, each 0 to 1. Slightly short and stocky, mid twenties.
SHAPE = {
    "gender": 1.0,
    "age": 0.5,
    "muscle": 0.4,
    "weight": 0.85,
    "proportions": 0.5,
    "height": 0.42,
    "cupsize": 0.5,
    "firmness": 0.5,
    "race": {"asian": 1.0, "caucasian": 0.0, "african": 0.0},
}


def _services():
    bpy.ops.preferences.addon_enable(module=MPFB)
    from bl_ext.user_default.mpfb.services.assetservice import AssetService
    from bl_ext.user_default.mpfb.services.humanservice import HumanService

    return HumanService, AssetService


def build_alex_human(look=None, shape=None, rig_name="game_engine", skin_type="ENHANCED_SSS"):
    """
    Generate Alex standing at the origin, facing -Y. Returns his rig, body and parts.
    skin_type "ENHANCED_SSS" looks best in Blender renders; "GAMEENGINE" is the
    plain version that survives export to the web.
    """
    HumanService, AssetService = _services()
    look = {**LOOK, **(look or {})}
    shape = {**SHAPE, **(shape or {})}

    before = set(bpy.data.objects)
    body = HumanService.create_human(scale=0.1, macro_detail_dict=shape)
    body.name = "Alex_Body"
    HumanService.add_builtin_rig(body, rig_name)
    rig = body.parent
    rig.name = "Alex"

    skin = AssetService.find_asset_absolute_path(f"{look['skin']}/{look['skin']}.mhmat", "skins")
    HumanService.set_character_skin(skin, body, skin_type=skin_type)

    parts = {}
    kinds = (
        ("eyes", "eyes", "Eyes"), ("eyebrows", "eyebrows", "Eyebrows"), ("eyelashes", "eyelashes", "Eyelashes"),
        ("teeth", "teeth", "Teeth"), ("hair", "hair", "Hair"), ("clothes", "clothes", "Clothes"),
    )
    for key, subdir, asset_type in kinds:
        name = look.get(key)
        if not name:
            continue
        path = AssetService.find_asset_absolute_path(f"{name}/{name}.mhclo", subdir)
        if path is None:
            print(f"Alex: asset not found, skipping: {subdir}/{name}")
            continue
        seen = set(bpy.data.objects)
        HumanService.add_mhclo_asset(path, body, asset_type=asset_type)
        new = [o for o in set(bpy.data.objects) - seen if o.type == "MESH"]
        if new:
            new[0].name = f"Alex_{key.capitalize()}"
            parts[key] = new[0]

    created = [o for o in set(bpy.data.objects) - before]
    return {"rig": rig, "body": body, "parts": parts, "objects": created}


# Real-world frame measurements in metres, for build_glasses()
GLASSES_REAL = {"half_w": 0.025, "half_h": 0.017, "t": 0.0042}


def tint(obj, value=1.0, saturation=1.0):
    """Darken or desaturate an object's textures, e.g. brown hair to black."""
    changed = 0
    for slot in obj.material_slots:
        nt = slot.material.node_tree if slot.material else None
        if nt is None:
            continue
        for link in list(nt.links):
            if link.to_socket.name not in ("Base Color", "Diffuse", "Color") or link.to_node.type == "HUE_SAT":
                continue
            if link.to_node.type not in ("BSDF_PRINCIPLED", "GROUP", "BSDF_DIFFUSE"):
                continue
            hsv = nt.nodes.new("ShaderNodeHueSaturation")
            hsv.inputs["Saturation"].default_value = saturation
            hsv.inputs["Value"].default_value = value
            source, target = link.from_socket, link.to_socket
            nt.links.new(source, hsv.inputs["Color"])
            nt.links.new(hsv.outputs[0], target)
            changed += 1
    if not changed:
        print(f"Alex: could not tint {obj.name}; its material has no colour input I recognise")
    return changed


def style_alex(alex):
    """Black hair, black tee and dark jeans, plus his glasses."""
    parts = alex["parts"]
    if "hair" in parts:
        tint(parts["hair"], value=0.16, saturation=0.5)
    if "eyebrows" in parts:
        tint(parts["eyebrows"], value=0.5)
    if "clothes" in parts:
        tint(parts["clothes"], value=0.035, saturation=0.3)
    alex["glasses"] = add_glasses(alex)
    return alex


def add_glasses(alex):
    """Fit the frames to his eyes and attach them to the head bone."""
    eyes = alex["parts"].get("eyes")
    if eyes is None:
        return None
    bpy.context.view_layer.update()
    corners = [eyes.matrix_world @ Vector(c) for c in eyes.bound_box]
    lo = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    hi = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    eyeball = hi.z - lo.z
    eye_x = (hi.x - lo.x) / 2 - eyeball / 2
    bridge = Vector(((lo.x + hi.x) / 2, lo.y - 0.014, (lo.z + hi.z) / 2 - 0.004))
    g = build_glasses(None, eye_x=eye_x, temple_end=(eye_x + GLASSES_REAL["half_w"] + 0.012, 0.1), **GLASSES_REAL)
    rig = alex["rig"]
    g.parent = rig
    g.parent_type = "BONE"
    g.parent_bone = "head"
    bpy.context.view_layer.update()
    g.matrix_world = Matrix.Translation(bridge)
    return g


# ---------------------------------------------------------------------------
# Posing. Rotations are given in the rig's own space (X right, Y back, Z up
# for a standing figure) so they read naturally whichever way he is lying.
# ---------------------------------------------------------------------------
def bone(alex, name):
    return alex["rig"].pose.bones[name]


def _rest(alex, name):
    return alex["rig"].data.bones[name].matrix_local.to_3x3()


def _apply(alex, name, rig_space_rotation):
    b = bone(alex, name)
    m = _rest(alex, name)
    b.rotation_mode = "QUATERNION"
    local = (m.inverted() @ rig_space_rotation @ m).to_quaternion()
    b.rotation_quaternion = local @ b.rotation_quaternion


def rig_rotate(alex, name, axis, degrees):
    """Turn a bone around one of the rig's axes ("X", "Y" or "Z")."""
    _apply(alex, name, Matrix.Rotation(math.radians(degrees), 3, axis))


def aim_bone(alex, name, direction):
    """Point a bone along a direction given in rig space."""
    current = _rest(alex, name) @ Vector((0, 1, 0))
    _apply(alex, name, current.rotation_difference(Vector(direction).normalized()).to_matrix())


def reset_pose(alex):
    for b in alex["rig"].pose.bones:
        b.rotation_mode = "QUATERNION"
        b.rotation_quaternion = (1, 0, 0, 0)
        b.location = (0, 0, 0)


def _arms_down(alex, out=0.16, forward=0.0):
    for name in ("upperarm_l", "upperarm_r"):
        side = 1 if alex["rig"].data.bones[name].head_local.x > 0 else -1
        aim_bone(alex, name, (side * out, -forward, -1))


def set_eyes_closed(alex, amount):
    """0 = open, 1 = shut. Uses MakeHuman's eyelid shapes; the lashes are refitted to follow."""
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    import bl_ext.user_default.mpfb as mpfb

    body = alex["body"]
    folder = os.path.join(os.path.dirname(mpfb.__file__), "data", "targets", "expression", "units", "asian")
    for side in ("left", "right"):
        name = f"eye-{side}-closure"
        keys = body.data.shape_keys.key_blocks if body.data.shape_keys else []
        key = next((k for k in keys if name in k.name), None)
        if key is None:
            TargetService.load_target(body, os.path.join(folder, name + ".target.gz"), weight=amount, name=name)
        else:
            key.value = amount
    # Once the mesh has been trimmed for export MPFB can no longer refit to it
    if not alex.get("frozen") and "eyelashes" in alex["parts"]:
        HumanService.refit(alex["parts"]["eyelashes"])


def pose_standing(alex):
    reset_pose(alex)
    _arms_down(alex, out=0.22)


def pose_asleep(alex):
    """Flat on his back, arms by his sides, toes pointed so they stay under the duvet."""
    reset_pose(alex)
    set_eyes_closed(alex, 1.0)
    # Arms angled back a little: his elbows bend forward at rest, which would
    # otherwise lift his hands up through the duvet.
    _arms_down(alex, out=0.16, forward=-0.3)
    for name in ("foot_l", "foot_r"):
        rig_rotate(alex, name, "X", 45)
    rig_rotate(alex, "head", "Z", 12)
    if alex.get("glasses"):
        set_visible(alex["glasses"], False)


def pose_awake(alex, lean=72, head_turn=35):
    """Sat up in bed: hips fold while the legs stay flat, head turned to the room."""
    reset_pose(alex)
    set_eyes_closed(alex, 0.0)
    rig_rotate(alex, "pelvis", "X", lean)
    for name in ("thigh_l", "thigh_r"):
        rig_rotate(alex, name, "X", -lean)
    _arms_down(alex, out=0.2, forward=0.25)
    for name in ("foot_l", "foot_r"):
        rig_rotate(alex, name, "X", 50)
    rig_rotate(alex, "neck_01", "Z", head_turn * 0.5)
    rig_rotate(alex, "head", "Z", head_turn * 0.5)
    if alex.get("glasses"):
        set_visible(alex["glasses"], True)
