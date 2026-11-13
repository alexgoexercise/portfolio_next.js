"""
Shared palette and modelling helpers for the diorama's Blender scripts.

Units are metres, Z is up.
"""

import math

import bmesh
import bpy
from mathutils import Vector

# ----------------------------------------------------------------------------
# Palette: warm 70s tones, muted so the lamps do the talking
# ----------------------------------------------------------------------------
PALETTE = {
    "wall": "#d9c7a3",
    "panel": "#7a4a2b",
    "panel_dark": "#5e3620",
    "floor_a": "#8a5a36",
    "floor_b": "#7d5030",
    "floor_c": "#96643d",
    "base": "#2b1d17",
    "trim": "#ead9b8",
    "wood": "#9b6a3f",
    "wood_dark": "#5a3a22",
    "cream": "#efe3c8",
    "orange": "#d9652b",
    "rust": "#a8421f",
    "mustard": "#d9a23a",
    "teal": "#2f7a78",
    "teal_dark": "#1f4f52",
    "olive": "#6d7a3a",
    "brown": "#4a2f20",
    "black": "#1a1614",
    "metal": "#b9b2a6",
    "leaf": "#3f7a48",
    "terracotta": "#b5603a",
    "duvet": "#c9623a",
    "sheet": "#efe6d2",
}


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def srgb(hex_color):
    """'#rrggbb' -> linear RGBA tuple, which is what Blender materials expect."""
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


_materials = {}


def _hex_scaled(hex_color, k):
    """Linear RGBA of a hex colour, brightened or darkened by factor k."""
    r, g, b, a = srgb(hex_color)
    return (min(r * k, 1.0), min(g * k, 1.0), min(b * k, 1.0), a)


def _sock(sockets, *names):
    """First socket matching one of the names (they differ between Blender versions)."""
    for n in names:
        if n in sockets:
            return sockets[n]
    return sockets[0]


def _add_surface(m, bsdf, kind, color, axis):
    """
    Layer procedural detail onto a material so it reads as a real surface.
    kind: "wood" (grain along axis), "fabric", "rug" or "plaster".
    These nodes only show in Blender renders; the web export needs them baked.
    """
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    coord = N("ShaderNodeTexCoord")
    info = N("ShaderNodeObjectInfo")
    jitter = N("ShaderNodeVectorMath")  # shift the pattern per object so no two match
    jitter.operation = "MULTIPLY_ADD"
    L(info.outputs["Random"], jitter.inputs[0])
    jitter.inputs[1].default_value = (7.3, 5.1, 3.7)
    L(coord.outputs["Object"], jitter.inputs[2])
    mapping = N("ShaderNodeMapping")
    L(jitter.outputs[0], mapping.inputs["Vector"])

    def noise(scale, detail, rough=0.55):
        n = N("ShaderNodeTexNoise")
        L(mapping.outputs[0], n.inputs["Vector"])
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        n.inputs["Roughness"].default_value = rough
        return n

    def tint(source, lo, hi, lo_pos=0.3, hi_pos=0.7):
        ramp = N("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = lo_pos
        ramp.color_ramp.elements[0].color = _hex_scaled(color, lo)
        ramp.color_ramp.elements[1].position = hi_pos
        ramp.color_ramp.elements[1].color = _hex_scaled(color, hi)
        L(source.outputs[0], ramp.inputs[0])
        L(ramp.outputs[0], bsdf.inputs["Base Color"])

    def bump(source, strength, distance):
        b = N("ShaderNodeBump")
        b.inputs["Strength"].default_value = strength
        b.inputs["Distance"].default_value = distance
        L(source.outputs[0], b.inputs["Height"])
        L(b.outputs[0], bsdf.inputs["Normal"])

    if kind == "wood":
        stretch = [16.0, 16.0, 16.0]
        stretch["xyz".index(axis)] = 0.9  # long streaks along the grain
        mapping.inputs["Scale"].default_value = stretch
        tint(noise(3.0, 9.0, 0.62), 0.55, 1.12, 0.32, 0.72)
        bump(noise(9.0, 6.0), 0.12, 0.002)
    elif kind == "fabric":
        tint(noise(14.0, 4.0), 0.9, 1.06)
        bump(noise(520.0, 2.0, 0.7), 0.35, 0.0015)
        if "Sheen Weight" in bsdf.inputs:
            bsdf.inputs["Sheen Weight"].default_value = 0.35
    elif kind == "rug":
        tint(noise(40.0, 3.0), 0.82, 1.08)
        bump(noise(260.0, 2.0, 0.8), 0.9, 0.004)
        if "Sheen Weight" in bsdf.inputs:
            bsdf.inputs["Sheen Weight"].default_value = 0.5
    elif kind == "plaster":
        tint(noise(2.2, 5.0), 0.93, 1.03)
        bump(noise(55.0, 6.0, 0.7), 0.1, 0.002)


_wood = {}  # material name -> arguments, so grain-direction variants can be made


def grain(material, axis):
    """Swap a wood material for the variant whose grain runs along the given local axis."""
    spec = _wood.get(material.name)
    if spec is None:
        return material
    name, color, kw = spec
    return mat(name, color, kind="wood", axis=axis, **kw)


def mat(name, color, rough=0.75, metal=0.0, emit=None, emit_strength=0.0, alpha=1.0, kind=None, axis="z", sss=0.0):
    """Create (or reuse) a Principled material. kind adds procedural surface detail."""
    base_name = name
    if kind == "wood":
        name = f"{name}_grain_{axis}"
    elif kind:
        name = f"{name}_{kind}"
    if name in _materials:
        return _materials[name]
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nodes = m.node_tree.nodes
    bsdf = next((n for n in nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")
        out = next((n for n in nodes if n.type == "OUTPUT_MATERIAL"), None)
        if out is None:
            out = nodes.new("ShaderNodeOutputMaterial")
        m.node_tree.links.new(bsdf.outputs[0], out.inputs[0])

    def set_input(key, value):
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = value

    set_input("Base Color", srgb(color))
    set_input("Roughness", rough)
    set_input("Metallic", metal)
    if emit:
        set_input("Emission Color", srgb(emit))
        set_input("Emission Strength", emit_strength)
    if alpha < 1.0:  # see-through, used for the PC's glass panels
        set_input("Alpha", alpha)
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
    if sss > 0 and "Subsurface Weight" in bsdf.inputs:  # light bleeding through skin
        bsdf.inputs["Subsurface Weight"].default_value = sss
        if "Subsurface Scale" in bsdf.inputs:
            bsdf.inputs["Subsurface Scale"].default_value = 0.012
    if kind:
        _add_surface(m, bsdf, kind, color, axis)
    if kind == "wood":
        _wood[name] = (base_name, color, {"rough": rough})
    m.diffuse_color = srgb(color)  # viewport colour in solid mode
    _materials[name] = m
    return m


SURFACES = {
    "wall": "plaster",
    "panel": "wood", "panel_dark": "wood", "floor_a": "wood", "floor_b": "wood", "floor_c": "wood",
    "wood": "wood", "wood_dark": "wood",
    "duvet": "fabric", "sheet": "fabric",
}


def M(key, **kw):
    """Material straight from the palette, with its usual surface detail."""
    kw.setdefault("kind", SURFACES.get(key))
    return mat(key, PALETTE[key], **kw)


def group(name, loc=(0, 0, 0), rot_z=0.0, parent=None):
    """An empty that holds one piece of furniture. Children use local coordinates."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.15
    e.location = loc
    e.rotation_euler = (0, 0, math.radians(rot_z))
    e.parent = parent
    bpy.context.scene.collection.objects.link(e)
    return e


def _finish(name, bm, loc, rot, material, parent, smooth, bevel):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
        try:
            me.set_sharp_from_angle(angle=math.radians(50))
        except Exception:
            pass
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    ob.parent = parent
    bpy.context.scene.collection.objects.link(ob)
    if bevel:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.limit_method = "ANGLE"
    return ob


def box(name, size, loc, material, parent=None, rot=(0, 0, 0), bevel=0.008):
    """Box centred on loc. size = (x, y, z)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    material = grain(material, "xyz"[max(range(3), key=lambda i: size[i])])
    return _finish(name, bm, loc, rot, material, parent, False, bevel)


def cyl(name, radius, height, loc, material, parent=None, rot=(0, 0, 0), radius_top=None, segments=32, bevel=0.0):
    """Upright cylinder (or cone if radius_top differs) centred on loc."""
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segments,
        radius1=radius,
        radius2=radius if radius_top is None else radius_top,
        depth=height,
    )
    material = grain(material, "z")
    return _finish(name, bm, loc, rot, material, parent, True, bevel)


def ball(name, radius, loc, material, parent=None, scale=(1, 1, 1), rot=(0, 0, 0), segments=24):
    """Sphere, optionally squashed into an ellipsoid with scale."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=segments // 2, radius=radius)
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    return _finish(name, bm, loc, rot, material, parent, True, 0)


def rod(name, p1, p2, radius, material, parent=None, segments=10):
    """Thin cylinder between two points."""
    a, b = Vector(p1), Vector(p2)
    d = b - a
    quat = d.to_track_quat("Z", "Y")
    return cyl(name, radius, d.length, (a + b) / 2, material, parent, rot=quat.to_euler(), segments=segments)


def point_light(name, loc, color, watts, radius=0.05, parent=None):
    data = bpy.data.lights.new(name, "POINT")
    data.color = srgb(color)[:3]
    data.energy = watts
    data.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, data)
    ob.location = loc
    ob.parent = parent
    bpy.context.scene.collection.objects.link(ob)
    return ob


def look_at(ob, target):
    direction = Vector(target) - ob.location
    ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
