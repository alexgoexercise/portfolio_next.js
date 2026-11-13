"""
Builds the diorama bedroom from scratch.

Run from the repo root:
    /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
        --python blender/build_room.py

Outputs:
    blender/room.blend             open this in Blender to look around or edit by hand
    blender/renders/room_*.png     preview renders
    public/models/room.glb         the web export used by the site

Units are metres, Z is up. The room is centred on the origin with its floor at
z = 0. The back wall is at +Y and the left wall at -X; the front and right
sides are open so the camera can see in.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from alex import build_glasses, set_visible  # noqa: E402
from alex_human import GLASSES_REAL, build_alex_human, pose_asleep, pose_awake, style_alex  # noqa: E402
from lib import M, PALETTE, ball, box, cyl, group, look_at, mat, point_light, rod, srgb  # noqa: E402
REPO = os.path.dirname(HERE)
RENDER_DIR = os.path.join(HERE, "renders")
QUICK = "--quick" in sys.argv  # low-sample renders while iterating

# ----------------------------------------------------------------------------
# Room dimensions
# ----------------------------------------------------------------------------
W, D, H = 4.4, 3.8, 2.4  # width (x), depth (y), wall height (z)
T = 0.12  # wall thickness
X0, X1 = -W / 2, W / 2
Y0, Y1 = -D / 2, D / 2

# ----------------------------------------------------------------------------
# Scene pieces
# ----------------------------------------------------------------------------
BED_POS = (X0 + 0.56, Y1 - 1.03, 0)  # along the left wall, head against the back wall
ALEX_IN_BED = (0.02, -0.74, 0.6)  # where his feet sit, relative to the bed
WIN_Y0, WIN_Y1 = 0.15, 1.15  # window opening on the left wall
WIN_Z0, WIN_Z1 = 1.05, 1.95


def build_shell():
    g = group("Room")
    wall = M("wall", rough=0.95)

    # Base slab the whole diorama sits on
    box("Base", (W + T, D + T, 0.28), (-T / 2, T / 2, -0.04 - 0.14), M("base", rough=0.9), g, bevel=0.02)

    # Floorboards running front to back, in three slightly different tones
    plank_w = 0.2
    n = round(W / plank_w)
    tones = [M("floor_a", rough=0.6), M("floor_b", rough=0.6), M("floor_c", rough=0.6)]
    for i in range(n):
        x = X0 + plank_w * (i + 0.5)
        box(f"Plank_{i:02d}", (plank_w - 0.006, D, 0.04), (x, 0, -0.02), tones[(i * 7) % 3], g, bevel=0.004)

    # Back wall
    box("Wall_Back", (W + T, T, H), (-T / 2, Y1 + T / 2, H / 2), wall, g, bevel=0.01)

    # Left wall, built from four pieces around the window opening
    xw = X0 - T / 2
    box("Wall_Left_Below", (T, D, WIN_Z0), (xw, 0, WIN_Z0 / 2), wall, g, bevel=0)
    box("Wall_Left_Above", (T, D, H - WIN_Z1), (xw, 0, (H + WIN_Z1) / 2), wall, g, bevel=0)
    box("Wall_Left_Front", (T, WIN_Y0 - Y0, WIN_Z1 - WIN_Z0), (xw, (Y0 + WIN_Y0) / 2, (WIN_Z0 + WIN_Z1) / 2), wall, g, bevel=0)
    box("Wall_Left_Rear", (T, Y1 - WIN_Y1, WIN_Z1 - WIN_Z0), (xw, (Y1 + WIN_Y1) / 2, (WIN_Z0 + WIN_Z1) / 2), wall, g, bevel=0)

    # Wood panelling on the lower part of both walls
    panel_h = 0.92
    panel, panel_dark = M("panel", rough=0.55), M("panel_dark", rough=0.55)
    slat = 0.2
    for i in range(round(W / slat)):
        x = X0 + slat * (i + 0.5)
        box(f"Panel_Back_{i:02d}", (slat - 0.008, 0.02, panel_h), (x, Y1 - 0.01, panel_h / 2), panel if i % 2 else panel_dark, g, bevel=0.003)
    for i in range(round(D / slat)):
        y = Y0 + slat * (i + 0.5)
        box(f"Panel_Left_{i:02d}", (0.02, slat - 0.008, panel_h), (X0 + 0.01, y, panel_h / 2), panel if i % 2 else panel_dark, g, bevel=0.003)
    box("Rail_Back", (W, 0.035, 0.04), (0, Y1 - 0.0175, panel_h + 0.02), M("wood_dark", rough=0.5), g)
    box("Rail_Left", (0.035, D, 0.04), (X0 + 0.0175, 0, panel_h + 0.02), M("wood_dark", rough=0.5), g)
    return g


def build_window():
    g = group("Window", (X0 - T / 2, (WIN_Y0 + WIN_Y1) / 2, (WIN_Z0 + WIN_Z1) / 2))
    frame = M("trim", rough=0.6)
    wy, wz = WIN_Y1 - WIN_Y0, WIN_Z1 - WIN_Z0
    f = 0.05
    box("Frame_Top", (T + 0.03, wy + f, f), (0, 0, wz / 2), frame, g)
    box("Frame_Bottom", (T + 0.03, wy + f, f), (0, 0, -wz / 2), frame, g)
    box("Frame_L", (T + 0.03, f, wz), (0, -wy / 2, 0), frame, g)
    box("Frame_R", (T + 0.03, f, wz), (0, wy / 2, 0), frame, g)
    box("Mullion_V", (0.03, 0.03, wz), (0, 0, 0), frame, g)
    box("Mullion_H", (0.03, wy, 0.03), (0, 0, 0), frame, g)
    box("Sill", (0.16, wy + 0.14, 0.03), (T / 2 + 0.05, 0, -wz / 2 - 0.03), frame, g)

    # Curtains pulled to either side, and their rod
    curtain = M("rust", rough=0.95, kind="fabric")
    cx = T / 2 + 0.06
    for side, name in ((-1, "Front"), (1, "Rear")):
        for k in range(3):  # three soft folds per curtain
            y = side * (wy / 2 + 0.06 + k * 0.075)
            ball(f"Curtain_{name}_{k}", 0.05, (cx, y, -0.06), curtain, g, scale=(0.7, 0.95, 11.5))
    rod("Curtain_Rod", (cx, -wy / 2 - 0.3, wz / 2 + 0.1), (cx, wy / 2 + 0.3, wz / 2 + 0.1), 0.012, M("wood_dark"), g)
    return g


def build_bed():
    # Along the left wall, head against the back wall
    g = group("Bed", BED_POS)
    wood = M("wood", rough=0.5)
    box("Frame", (1.04, 2.0, 0.16), (0, 0, 0.2), wood, g, bevel=0.015)
    for sx in (-0.46, 0.46):
        for sy in (-0.93, 0.93):
            cyl("Leg", 0.03, 0.14, (sx, sy, 0.07), M("wood_dark"), g, radius_top=0.04, segments=12)
    box("Headboard", (1.04, 0.06, 0.75), (0, 0.985, 0.5), wood, g, bevel=0.03)
    box("Mattress", (0.98, 1.9, 0.18), (0, -0.02, 0.37), M("sheet", rough=0.95), g, bevel=0.04)
    ball("Pillow", 0.2, (0.02, 0.72, 0.5), M("cream", rough=0.95, kind="fabric"), g, scale=(1.75, 0.95, 0.26))
    # Puffy duvet in two parts: the lower part stays over his legs, the upper
    # part covers his chest while he sleeps and is hidden when he sits up.
    duvet = M("duvet", rough=0.95)
    for name, length, y in (("Duvet_Lower", 0.9, -0.4), ("Duvet_Upper", 0.42, 0.24)):
        ob = box(name, (0.96, length, 0.43), (0, y, 0.655), duvet, g, bevel=0.11)
        ob.modifiers[0].segments = 6
        for poly in ob.data.polygons:
            poly.use_smooth = True
    fold = box("Duvet_Upper_Fold", (0.9, 0.09, 0.05), (0, 0.4, 0.79), M("mustard", rough=0.95, kind="fabric"), g, bevel=0.02)
    fold.parent = bpy.data.objects["Duvet_Upper"]
    fold.location = (0, 0.16, 0.205)
    return g


def build_nightstand():
    g = group("Nightstand", (X0 + 1.42, Y1 - 0.24, 0))
    wood = M("wood_dark", rough=0.5)
    box("Body", (0.46, 0.4, 0.4), (0, 0, 0.34), wood, g, bevel=0.015)
    box("Drawer", (0.38, 0.02, 0.14), (0, -0.205, 0.42), M("wood", rough=0.5), g)
    ball("Knob", 0.018, (0, -0.225, 0.42), M("mustard", rough=0.3, metal=0.8), g)
    for sx in (-0.18, 0.18):
        for sy in (-0.15, 0.15):
            cyl("Leg", 0.018, 0.14, (sx, sy, 0.07), wood, g, radius_top=0.026, segments=12)

    # Mushroom lamp: the main warm light in the room
    lamp = group("MushroomLamp", (-0.1, 0.07, 0.54), parent=g)
    glow = mat("lamp_glow", PALETTE["orange"], rough=0.4, emit="#ff8a3c", emit_strength=5.0)
    cyl("Stem", 0.05, 0.16, (0, 0, 0.08), M("cream", rough=0.4), lamp, radius_top=0.032, segments=20)
    ball("Cap", 0.15, (0, 0, 0.2), glow, lamp, scale=(1, 1, 0.62))
    point_light("Lamp_Light", (0, 0, 0.16), "#ff9a4d", 50, radius=0.12, parent=lamp)

    # Alarm clock
    box("Clock", (0.1, 0.06, 0.07), (0.13, 0.12, 0.575), M("teal", rough=0.4), g, bevel=0.015)
    box("Clock_Face", (0.07, 0.005, 0.04), (0.13, 0.088, 0.578), mat("clock_face", "#2a0f08", emit="#ff5a2a", emit_strength=3.0), g, bevel=0)

    # Phone, face up with a notification lit: this is the way in to Contacts
    phone = group("Phone", (0.13, -0.08, 0.54), rot_z=12, parent=g)
    box("Body", (0.075, 0.155, 0.009), (0, 0, 0.0045), mat("phone_body", "#18181c", rough=0.3, metal=0.6), phone, bevel=0.003)
    box("Screen", (0.068, 0.147, 0.001), (0, 0, 0.0095), mat("phone_screen", "#0a1026", rough=0.15, emit="#3550c8", emit_strength=0.9), phone, bevel=0)
    box("Notification", (0.056, 0.024, 0.001), (0, 0.032, 0.0102), mat("phone_note", "#dfe6ff", emit="#dfe6ff", emit_strength=2.5), phone, bevel=0)
    point_light("Phone_Light", (0, 0, 0.08), "#8fa4ff", 0.35, radius=0.04, parent=phone)
    return g


def rgb_fan(name, loc, axis, glow, parent, radius=0.058):
    """Case fan seen as a glowing ring: a lit disc with a dark hub on both faces."""
    quarter = math.radians(90)
    rot = {"x": (0, quarter, 0), "y": (quarter, 0, 0), "z": (0, 0, 0)}[axis]
    step = {"x": Vector((1, 0, 0)), "y": Vector((0, 1, 0)), "z": Vector((0, 0, 1))}[axis] * 0.003
    dark = mat("pc_fan_hub", "#101014", rough=0.5)
    cyl(f"{name}_Glow", radius, 0.004, loc, glow, parent, rot=rot, segments=40)
    for k, sign in enumerate((-1, 1)):
        cyl(f"{name}_Hub_{k}", radius * 0.8, 0.003, Vector(loc) + step * sign, dark, parent, rot=rot, segments=40)


def build_pc(loc, parent):
    """Mid-tower gaming PC. Front faces -Y; the glass side panel faces +X."""
    g = group("GamingPC", loc, parent=parent)
    w, d, h = 0.22, 0.45, 0.46
    z0 = 0.015  # height of the feet
    case = mat("pc_case", "#15151a", rough=0.45, metal=0.3)
    inner = mat("pc_inner", "#2b2b36", rough=0.6)
    glass = mat("pc_glass", "#a8c0d8", rough=0.05, alpha=0.12)
    pink = mat("rgb_pink", "#2a0a1a", emit="#ff4fa3", emit_strength=6.0)
    cyan = mat("rgb_cyan", "#0a222a", emit="#3fe0ff", emit_strength=6.0)
    purple = mat("rgb_purple", "#160a2a", emit="#9a6bff", emit_strength=6.0)

    # Chassis
    for sx in (-0.08, 0.08):
        for sy in (-0.17, 0.17):
            box("Foot", (0.03, 0.05, z0), (sx, sy, z0 / 2), case, g, bevel=0.003)
    box("Bottom", (w, d, 0.012), (0, 0, z0 + 0.006), case, g, bevel=0.004)
    box("Top", (w, d, 0.012), (0, 0, z0 + h - 0.006), case, g, bevel=0.004)
    box("Back", (w, 0.012, h), (0, d / 2 - 0.006, z0 + h / 2), case, g, bevel=0.004)
    box("Side_Solid", (0.012, d, h), (-w / 2 + 0.006, 0, z0 + h / 2), case, g, bevel=0.004)
    box("Corner_Post", (0.012, 0.012, h), (w / 2 - 0.006, -d / 2 + 0.006, z0 + h / 2), case, g, bevel=0.003)
    box("Glass_Side", (0.005, d - 0.02, h - 0.02), (w / 2 - 0.003, 0.004, z0 + h / 2), glass, g, bevel=0)
    box("Glass_Front", (w - 0.02, 0.005, h - 0.02), (-0.004, -d / 2 + 0.003, z0 + h / 2), glass, g, bevel=0)
    ball("Power_LED", 0.006, (0.07, -d / 2 + 0.03, z0 + h + 0.001), cyan, g, segments=8)

    # Power supply shroud along the bottom, with a light strip on its edge
    box("PSU_Shroud", (w - 0.03, d - 0.03, 0.09), (-0.002, 0.002, z0 + 0.057), inner, g, bevel=0.004)
    box("Shroud_Strip", (0.004, d - 0.08, 0.006), (w / 2 - 0.016, 0, z0 + 0.106), purple, g, bevel=0)

    # Motherboard on the solid side, with everything plugged into it
    mb_x = -w / 2 + 0.016
    box("Motherboard", (0.006, 0.27, 0.3), (mb_x, 0.06, z0 + 0.27), mat("pc_board", "#1d2433", rough=0.7), g, bevel=0)

    # Graphics card
    box("GPU", (0.135, 0.3, 0.048), (mb_x + 0.07, 0.03, z0 + 0.2), mat("pc_gpu", "#1c1c22", rough=0.4, metal=0.5), g, bevel=0.005)
    box("GPU_Strip", (0.004, 0.25, 0.012), (mb_x + 0.139, 0.03, z0 + 0.2), cyan, g, bevel=0)
    box("GPU_Backplate", (0.13, 0.29, 0.004), (mb_x + 0.07, 0.03, z0 + 0.226), mat("pc_plate", "#3a3a44", rough=0.3, metal=0.8), g, bevel=0)

    # Liquid cooler: pump on the CPU, tubes up to a radiator under the top panel
    pump = (mb_x + 0.022, 0.1, z0 + 0.35)
    quarter = math.radians(90)
    cyl("Pump", 0.036, 0.034, pump, case, g, rot=(0, quarter, 0), segments=32)
    cyl("Pump_Ring", 0.031, 0.004, (pump[0] + 0.018, pump[1], pump[2]), pink, g, rot=(0, quarter, 0), segments=32)
    cyl("Pump_Cap", 0.022, 0.004, (pump[0] + 0.021, pump[1], pump[2]), case, g, rot=(0, quarter, 0), segments=32)
    tube = mat("pc_tube", "#0c0c0f", rough=0.6)
    for k, dy in enumerate((-0.012, 0.012)):
        mid = (pump[0] + 0.07, pump[1] - 0.05 + dy, z0 + h - 0.11)
        rod(f"Tube_{k}a", (pump[0] + 0.01, pump[1] + dy, pump[2] + 0.03), mid, 0.006, tube, g, segments=8)
        rod(f"Tube_{k}b", mid, (0.02, -0.02 + dy, z0 + h - 0.045), 0.006, tube, g, segments=8)
    box("Radiator", (w - 0.05, 0.27, 0.026), (0, -0.03, z0 + h - 0.027), inner, g, bevel=0.003)
    rgb_fan("Fan_Top_A", (0, -0.1, z0 + h - 0.048), "z", purple, g)
    rgb_fan("Fan_Top_B", (0, 0.035, z0 + h - 0.048), "z", pink, g)

    # Memory sticks with lit tops
    for k in range(4):
        y = -0.03 - k * 0.013
        box(f"RAM_{k}", (0.03, 0.006, 0.13), (mb_x + 0.018, y, z0 + 0.35), case, g, bevel=0)
        box(f"RAM_Light_{k}", (0.005, 0.006, 0.13), (mb_x + 0.0355, y, z0 + 0.35), pink if k % 2 else cyan, g, bevel=0)

    # Exhaust fan at the back, three intake fans behind the front glass
    rgb_fan("Fan_Rear", (0.005, d / 2 - 0.03, z0 + 0.36), "y", cyan, g, radius=0.052)
    for k, glow in enumerate((pink, purple, cyan)):
        rgb_fan(f"Fan_Front_{k}", (0, -d / 2 + 0.03, z0 + 0.09 + k * 0.14), "y", glow, g)

    point_light("PC_Light", (0.03, -0.02, z0 + 0.27), "#d9b0ff", 2.5, radius=0.04, parent=g)
    return g


def build_headset(loc, parent):
    g = group("Headset", loc, rot_z=20, parent=parent)
    dark = M("black", rough=0.4)
    cyl("Stand_Base", 0.065, 0.012, (0, 0, 0.006), dark, g, segments=32)
    rod("Stand_Pole", (0, 0, 0.01), (0, 0, 0.27), 0.008, dark, g)
    r, cz, steps = 0.085, 0.19, 10
    arc = [(r * math.cos(math.pi * i / steps), 0, cz + r * math.sin(math.pi * i / steps)) for i in range(steps + 1)]
    for i in range(steps):
        rod(f"Band_{i}", arc[i], arc[i + 1], 0.009, dark, g, segments=8)
    for side, name in ((-1, "L"), (1, "R")):
        ball(f"Cup_{name}", 0.05, (side * r, 0, cz - 0.03), dark, g, scale=(0.5, 1, 1.2))
        ball(f"Cushion_{name}", 0.045, (side * (r - 0.018), 0, cz - 0.03), M("cream", rough=0.9), g, scale=(0.35, 0.9, 1.1))
    return g


def build_monitor(name, loc, rot_z, parent, screen):
    """24-inch monitor on a small stand. loc is the centre of the stand's base."""
    g = group(name, loc, rot_z=rot_z, parent=parent)
    dark = M("black", rough=0.4)
    box("Stand_Base", (0.22, 0.17, 0.012), (0, 0, 0.006), dark, g, bevel=0.004)
    box("Stand_Neck", (0.045, 0.03, 0.16), (0, 0.03, 0.09), dark, g, bevel=0.004)
    box("Panel", (0.55, 0.022, 0.33), (0, 0.015, 0.29), dark, g, bevel=0.006)
    box("Screen", (0.525, 0.004, 0.3), (0, 0.003, 0.293), screen, g, bevel=0)
    return g


def build_desk():
    # Long desk against the back wall: gaming PC, two monitors, keyboard,
    # mouse, headset and audio interface
    length, depth, top = 2.3, 0.7, 0.76
    g = group("Desk", (X1 - 0.12 - length / 2, Y1 - 0.02 - depth / 2, 0))
    wood = M("wood", rough=0.45)
    box("Top", (length, depth, 0.04), (0, 0, top - 0.02), wood, g, bevel=0.012)
    for sx in (-(length / 2 - 0.08), length / 2 - 0.08):
        for sy in (-(depth / 2 - 0.07), depth / 2 - 0.07):
            rod("Leg", (sx, sy, top - 0.04), (sx * 1.03, sy * 1.1, 0), 0.024, M("wood_dark"), g, segments=12)
    box("Drawer_Unit", (0.4, 0.56, 0.22), (0.85, 0, top - 0.15), M("wood_dark", rough=0.5), g, bevel=0.01)
    ball("Drawer_Knob", 0.016, (0.85, -0.29, top - 0.15), M("mustard", rough=0.3, metal=0.8), g)

    # Tower at the left end, glass side facing the monitors and the room
    build_pc((-(length / 2) + 0.16, 0.03, top), g)
    build_headset((-0.62, -0.12, top), g)

    # The workstation; the chair lines up with it
    wx = 0.1
    code = mat("screen_code", "#0d1a2a", rough=0.2, emit="#4f8fe0", emit_strength=0.9)
    daw = mat("screen_daw", "#1a1208", rough=0.2, emit="#e08a3a", emit_strength=0.8)
    build_monitor("Monitor_Left", (wx - 0.29, 0.14, top), 9, g, code)
    build_monitor("Monitor_Right", (wx + 0.29, 0.14, top), -9, g, daw)
    point_light("Monitor_Light", (wx, -0.12, top + 0.3), "#9fc4ff", 3.0, radius=0.2, parent=g)

    # Desk mat, backlit mechanical keyboard and mouse
    box("DeskMat", (0.86, 0.34, 0.004), (wx + 0.02, -0.15, top + 0.002), mat("desk_mat", "#1b1b22", rough=0.95), g, bevel=0)
    kb = group("Keyboard", (wx - 0.06, -0.17, top + 0.004), parent=g)
    glow = mat("rgb_pink", "#2a0a1a", emit="#ff4fa3", emit_strength=6.0)
    box("Underglow", (0.38, 0.145, 0.004), (0, 0, 0.002), glow, kb, bevel=0)
    box("Case", (0.37, 0.135, 0.02), (0, 0, 0.014), mat("kb_case", "#1c1c22", rough=0.5), kb, bevel=0.006)
    for row in range(4):
        box(f"Keys_{row}", (0.345, 0.024, 0.008), (0, 0.045 - row * 0.03, 0.028), M("cream", rough=0.6), kb, bevel=0.002)
    ball("Mouse", 0.035, (wx + 0.27, -0.17, top + 0.018), mat("kb_case", "#1c1c22"), g, scale=(0.85, 1.35, 0.5))
    box("Mouse_Light", (0.012, 0.03, 0.003), (wx + 0.27, -0.2, top + 0.0345), mat("rgb_cyan", "#0a222a"), g, bevel=0)

    # Audio interface with two gain knobs and a big volume knob
    ai = group("AudioInterface", (0.82, -0.04, top), rot_z=-6, parent=g)
    box("Body", (0.21, 0.15, 0.052), (0, 0, 0.026), M("rust", rough=0.45), ai, bevel=0.006)
    box("Face", (0.2, 0.006, 0.042), (0, -0.076, 0.026), M("black", rough=0.4), ai, bevel=0)
    metal = M("metal", rough=0.3, metal=1.0)
    quarter = math.radians(90)
    for k, x in enumerate((-0.07, -0.03)):
        cyl(f"Gain_{k}", 0.011, 0.014, (x, -0.085, 0.026), metal, ai, rot=(quarter, 0, 0), segments=16)
    cyl("Volume", 0.017, 0.016, (0.055, -0.086, 0.026), metal, ai, rot=(quarter, 0, 0), segments=20)
    ball("Signal_LED", 0.005, (0.012, -0.08, 0.036), mat("led_green", "#0a2a12", emit="#59ff8a", emit_strength=6.0), ai, segments=8)

    cyl("Mug", 0.04, 0.09, (1.02, -0.22, top + 0.045), M("mustard", rough=0.4), g, segments=20)
    return g


def build_chair():
    g = group("Chair", (X1 - 1.2, Y1 - 1.12, 0), rot_z=168)
    seat = M("mustard", rough=0.9, kind="fabric")
    wood = M("wood_dark", rough=0.5)
    box("Seat", (0.44, 0.44, 0.07), (0, 0, 0.46), seat, g, bevel=0.03)
    box("Back", (0.44, 0.06, 0.34), (0, 0.2, 0.8), seat, g, rot=(math.radians(-8), 0, 0), bevel=0.03)
    for sx in (-0.17, 0.17):
        rod("Back_Post", (sx, 0.19, 0.46), (sx, 0.215, 0.7), 0.015, wood, g)
        for sy in (-0.17, 0.17):
            rod("Leg", (sx, sy, 0.44), (sx * 1.2, sy * 1.2, 0), 0.018, wood, g, segments=12)
    return g


def build_shelf():
    # Floating shelf above the desk with books, a radio and a plant
    g = group("Shelf", (X1 - 1.12, Y1 - 0.11, 1.62))
    box("Board", (1.7, 0.22, 0.03), (0, 0, 0), M("wood_dark", rough=0.5), g)
    for sx in (-0.72, 0.72):
        box("Bracket", (0.03, 0.18, 0.1), (sx, 0, -0.06), M("black", rough=0.5), g)

    x = -0.8
    books = [
        (0.04, 0.24, "rust"), (0.05, 0.27, "teal"), (0.035, 0.22, "mustard"), (0.045, 0.26, "olive"),
        (0.04, 0.23, "cream"), (0.05, 0.25, "orange"), (0.035, 0.21, "teal_dark"),
    ]
    for i, (bw, bh, colour) in enumerate(books):
        box(f"Book_{i}", (bw, 0.16, bh), (x + bw / 2, 0, 0.015 + bh / 2), M(colour, rough=0.8), g, bevel=0.004)
        x += bw + 0.004
    box("Book_Leaning", (0.04, 0.16, 0.24), (x + 0.06, 0, 0.13), M("brown", rough=0.8), g, rot=(0, math.radians(-22), 0), bevel=0.004)

    # Little transistor radio
    radio = group("Radio", (0.2, 0, 0.015), parent=g)
    box("Body", (0.26, 0.09, 0.15), (0, 0, 0.075), M("teal", rough=0.5), radio, bevel=0.015)
    box("Grille", (0.12, 0.005, 0.1), (-0.05, -0.047, 0.075), M("cream", rough=0.8), radio, bevel=0.002)
    cyl("Dial", 0.03, 0.01, (0.07, -0.05, 0.09), M("mustard", rough=0.3, metal=0.6), radio, rot=(math.radians(90), 0, 0), segments=20)
    rod("Antenna", (0.11, 0, 0.15), (0.2, 0, 0.36), 0.004, M("metal", rough=0.3, metal=1.0), radio)

    build_plant("Plant_Shelf", (0.68, 0, 0.015), scale=0.55, parent=g)
    return g


def build_plant(name, loc, scale=1.0, parent=None):
    g = group(name, loc, parent=parent)
    g.scale = (scale, scale, scale)
    cyl("Pot", 0.11, 0.2, (0, 0, 0.1), M("terracotta", rough=0.85), g, radius_top=0.14, segments=20)
    cyl("Soil", 0.13, 0.01, (0, 0, 0.196), M("brown", rough=1.0), g, segments=20)
    leaf = M("leaf", rough=0.6)
    count = 9
    for i in range(count):
        ang = i * 2 * math.pi / count + (i % 2) * 0.3
        lean = math.radians(28 + (i % 3) * 14)
        length = 0.3 + (i % 3) * 0.07
        tip = Vector((math.cos(ang) * math.sin(lean), math.sin(ang) * math.sin(lean), math.cos(lean)))
        centre = Vector((0, 0, 0.2)) + tip * (length * 0.55)
        quat = tip.to_track_quat("Z", "Y")
        ball(f"Leaf_{i}", 0.5, centre, leaf, g, scale=(0.15, 0.04, length), rot=quat.to_euler(), segments=12)
    return g


def build_wall_art():
    g = group("WallArt")
    y = Y1 - 0.025

    # Sunset-stripes poster above the nightstand
    px, pz = X0 + 1.42, 1.62
    box("Poster_Frame", (0.5, 0.025, 0.66), (px, y, pz), M("wood_dark", rough=0.5), g)
    box("Poster_Paper", (0.44, 0.012, 0.6), (px, y - 0.012, pz), M("cream", rough=0.9), g, bevel=0)
    cyl("Poster_Sun", 0.13, 0.008, (px, y - 0.02, pz + 0.08), M("orange", rough=0.9), g, rot=(math.radians(90), 0, 0), segments=40)
    for k, colour in enumerate(("rust", "orange", "mustard", "teal")):
        box(f"Poster_Stripe_{k}", (0.44, 0.008, 0.045), (px, y - 0.021, pz - 0.1 - k * 0.055), M(colour, rough=0.9), g, bevel=0)

    # Vinyl record hung on the wall above the bed
    rx, rz = X0 + 0.56, 1.72
    cyl("Record", 0.19, 0.01, (rx, y, rz), M("black", rough=0.25), g, rot=(math.radians(90), 0, 0), segments=48)
    cyl("Record_Label", 0.065, 0.012, (rx, y - 0.001, rz), M("orange", rough=0.7), g, rot=(math.radians(90), 0, 0), segments=32)

    # String lights sagging along the back wall
    bulb = mat("bulb_glow", "#ffd9a0", emit="#ffb866", emit_strength=9.0)
    wire = M("black", rough=0.6)
    spans, per_span = 3, 7
    points = []
    for i in range(spans * per_span + 1):
        t = i / (spans * per_span)
        x = X0 + 0.12 + t * (W - 0.24)
        sag = math.sin(math.pi * (t * spans % 1.0))
        points.append((x, Y1 - 0.045, 2.26 - 0.13 * sag))
    for i, p in enumerate(points):
        if i:
            rod(f"Wire_{i:02d}", points[i - 1], p, 0.004, wire, g, segments=6)
        ball(f"Bulb_{i:02d}", 0.022, (p[0], p[1], p[2] - 0.03), bulb, g, segments=12)
    for i, x in enumerate((-1.2, 0, 1.2)):
        point_light(f"String_Light_{i}", (x, Y1 - 0.2, 2.1), "#ffb866", 9, radius=0.3, parent=g)
    return g


def build_tv_corner():
    # Low cabinet with a little CRT, against the left wall near the front
    g = group("TVCabinet", (X0 + 0.27, Y0 + 0.78, 0))
    wood = M("wood", rough=0.5)
    box("Cabinet", (0.44, 0.95, 0.36), (0, 0, 0.32), wood, g, bevel=0.015)
    for sy, name in ((-0.235, "A"), (0.235, "B")):
        box(f"Door_{name}", (0.02, 0.44, 0.3), (0.225, sy, 0.32), M("wood_dark", rough=0.5), g)
        ball(f"Door_Knob_{name}", 0.014, (0.24, sy * 0.3, 0.32), M("mustard", rough=0.3, metal=0.8), g)
    for sx in (-0.17, 0.17):
        for sy in (-0.42, 0.42):
            rod("Leg", (sx, sy, 0.15), (sx * 1.1, sy * 1.05, 0), 0.02, M("wood_dark"), g, segments=12)

    tv = group("TV", (0, -0.12, 0.5), parent=g)
    box("Shell", (0.38, 0.5, 0.38), (0, 0, 0.19), M("wood_dark", rough=0.45), tv, bevel=0.03)
    box("Bezel", (0.02, 0.36, 0.3), (0.19, -0.05, 0.2), M("black", rough=0.4), tv, bevel=0.02)
    tv_glow = mat("tv_glow", "#0d2424", rough=0.15, emit="#58d6c4", emit_strength=1.6)
    box("Screen", (0.012, 0.3, 0.24), (0.2, -0.05, 0.2), tv_glow, tv, bevel=0.03)
    for k in range(2):
        cyl(f"Knob_{k}", 0.02, 0.02, (0.2, 0.19, 0.27 - k * 0.1), M("mustard", rough=0.3, metal=0.7), tv, rot=(0, math.radians(90), 0), segments=16)
    metal = M("metal", rough=0.3, metal=1.0)
    rod("Antenna_L", (0, 0, 0.38), (-0.02, -0.2, 0.72), 0.005, metal, tv)
    rod("Antenna_R", (0, 0, 0.38), (-0.02, 0.2, 0.72), 0.005, metal, tv)
    point_light("TV_Light", (0.42, -0.05, 0.22), "#58d6c4", 1.5, radius=0.15, parent=tv)

    # Record sleeves leaning beside the TV
    for k, colour in enumerate(("rust", "teal", "mustard")):
        box(f"Sleeve_{k}", (0.31, 0.012, 0.31), (0.02, 0.3 + k * 0.03, 0.66), M(colour, rough=0.85), g, rot=(math.radians(-10), 0, 0), bevel=0.002)
    return g


def build_rugs():
    g = group("Rugs")
    # Round rug marking where the drum kit will stand
    radius = 1.16  # 50% more floor area than the first draft (was 0.95)
    cx, cy = X1 - radius - 0.1, Y0 + radius + 0.1
    rings = ((1.0, "teal_dark"), (0.86, "cream"), (0.76, "rust"), (0.53, "mustard"), (0.3, "teal"))
    for k, (r, colour) in enumerate(rings):
        cyl(f"DrumRug_{k}", r * radius, 0.012, (cx, cy, 0.006 + k * 0.0015), M(colour, rough=1.0, kind="rug"), g, segments=64)
    # Small runner beside the bed
    box("BedRug", (0.55, 1.1, 0.012), (X0 + 1.45, 0.25, 0.006), M("olive", rough=1.0, kind="rug"), g, bevel=0.004)
    box("BedRug_Stripe_A", (0.55, 0.08, 0.014), (X0 + 1.45, 0.62, 0.007), M("cream", rough=1.0, kind="rug"), g, bevel=0)
    box("BedRug_Stripe_B", (0.55, 0.08, 0.014), (X0 + 1.45, -0.12, 0.007), M("cream", rough=1.0, kind="rug"), g, bevel=0)
    return g


def build_drumkit():
    """
    Bring in the Drumstructor kit and stand it on the round rug. It is modelled
    in decimetres with the throne at +Y, so it is scaled by 0.1 and turned to
    face the open corner of the room.
    """
    path = os.path.join(HERE, "assets", "my_drumkit1.glb")
    if not os.path.exists(path):
        print("Drum kit file not found, skipping:", path)
        return None
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    roots = [o for o in set(bpy.data.objects) - before if o.parent is None]
    radius = 1.16
    g = group("DrumKit", (X1 - radius - 0.1, Y0 + radius + 0.1, 0.014), rot_z=32)
    for root in roots:
        root.parent = g
        root.scale = (0.1, 0.1, 0.1)
        root.location = (0.255, -0.16, 0.08)  # centre the kit and sit its feet on the rug
    return g


# ----------------------------------------------------------------------------
# Lighting, camera, render
# ----------------------------------------------------------------------------
def build_lighting():
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Night")
    try:
        world.use_nodes = True
    except Exception:
        pass
    bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs[0].default_value = srgb("#141a33")
        bg.inputs[1].default_value = 0.35
    scene.world = world

    # Moonlight through the window, falling across the bed
    data = bpy.data.lights.new("Moon", "AREA")
    data.color = srgb("#9db8ff")[:3]
    data.energy = 750
    data.size = 1.0
    moon = bpy.data.objects.new("Moon", data)
    moon.location = (X0 - 1.6, 0.65, 2.7)
    scene.collection.objects.link(moon)
    look_at(moon, (X0 + 1.0, 0.6, 0.4))

    # Warm pool of light over the drum kit, as if from a low pendant lamp
    data = bpy.data.lights.new("KitLight", "AREA")
    data.color = srgb("#ffc890")[:3]
    data.energy = 70
    data.size = 0.9
    kit_light = bpy.data.objects.new("KitLight", data)
    kit_light.location = (X1 - 1.0, Y0 + 1.0, 2.35)
    scene.collection.objects.link(kit_light)
    look_at(kit_light, (X1 - 1.26, Y0 + 1.26, 0.5))

    # Very soft cool fill from the open side so the shadows aren't pure black
    data = bpy.data.lights.new("Fill", "AREA")
    data.color = srgb("#6f7fd0")[:3]
    data.energy = 45
    data.size = 5.0
    fill = bpy.data.objects.new("Fill", data)
    fill.location = (4.0, -4.0, 4.5)
    scene.collection.objects.link(fill)
    look_at(fill, (0, 0, 0.5))


def add_camera(name, loc, target, lens):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    cam = bpy.data.objects.new(name, data)
    cam.location = loc
    bpy.context.scene.collection.objects.link(cam)
    look_at(cam, target)
    return cam


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24 if QUICK else 160
    try:
        scene.cycles.use_denoising = True
    except Exception:
        pass
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1050
    scene.render.resolution_percentage = 60 if QUICK else 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False


def render(cam, filename):
    scene = bpy.context.scene
    scene.camera = cam
    scene.render.filepath = os.path.join(RENDER_DIR, filename)
    bpy.ops.render.render(write_still=True)


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    build_shell()
    build_window()
    bed = build_bed()
    nightstand = build_nightstand()
    build_desk()
    build_chair()
    build_shelf()
    build_wall_art()
    build_tv_corner()
    build_rugs()
    build_plant("Plant_Floor", (X0 + 0.3, Y0 + 0.18, 0), scale=1.25)

    # The room is exported before Alex and the lights exist: he ships as his
    # own file (see build_alex.py) so the site can animate him separately.
    out = os.path.join(REPO, "public", "models", "room.glb")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)

    build_lighting()
    build_drumkit()  # kept out of room.glb: it is 31 MB and ships separately

    # Alex lies on his back in bed, head on the pillow, glasses on the nightstand
    # (the realistic one, generated by the MPFB add-on: see alex_human.py)
    alex = style_alex(build_alex_human())
    alex["rig"].parent = bed
    alex["rig"].location = ALEX_IN_BED
    alex["rig"].rotation_euler = (math.radians(-90), 0, 0)
    spare_glasses = build_glasses(nightstand, loc=(-0.07, -0.12, 0.562), rot_z=170, name="Glasses_On_Nightstand",
                                  eye_x=0.032, temple_end=(0.069, 0.1), **GLASSES_REAL)
    pose_asleep(alex)

    hero = add_camera("Cam_Hero", (7.6, -7.9, 6.4), (0.0, 0.1, 0.6), lens=62)
    pc = add_camera("Cam_PC", (0.95, 0.45, 1.5), (0.0, 1.5, 0.98), lens=42)
    close = add_camera("Cam_Close", (3.6, -4.6, 2.3), (0.9, 1.2, 0.95), lens=45)
    bed_cam = add_camera("Cam_Bed", (-0.35, 0.05, 2.25), (-1.6, 1.25, 0.65), lens=42)
    kit_cam = add_camera("Cam_Kit", (4.3, -4.4, 2.6), (0.9, -0.5, 0.6), lens=50)
    awake_cam = add_camera("Cam_Awake", (0.1, -1.1, 1.55), (-1.62, 1.0, 1.0), lens=45)

    os.makedirs(RENDER_DIR, exist_ok=True)
    setup_render()
    bpy.context.scene.camera = hero

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "room.blend"))

    if "--no-render" not in sys.argv:
        only_alex = "--alex-only" in sys.argv
        render(bed_cam, "room_alex_asleep.png")
        if not only_alex:
            render(hero, "room_hero.png")
            render(close, "room_close.png")
            render(pc, "room_pc.png")
            render(kit_cam, "room_kit.png")
        # Same scene with Alex woken up, to preview the pose
        pose_awake(alex)
        set_visible(spare_glasses, False)
        set_visible(bpy.data.objects["Duvet_Upper"], False)
        render(awake_cam, "room_alex_awake.png")
        pose_asleep(alex)
        set_visible(spare_glasses, True)
        set_visible(bpy.data.objects["Duvet_Upper"], True)
        bpy.context.scene.camera = hero

    print("DONE", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
