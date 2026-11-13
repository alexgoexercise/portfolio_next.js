"""
Alex, the character who sleeps in the diorama.

He is a puppet of rigid parts joined at named pivots, not a skinned mesh.
Rotating a pivot moves everything attached to it:

    Alex                 root, at his feet
      Alex_Hips          waist height
        Alex_Leg_L / R   hip joints
        Alex_Torso       bends at the waist (this is what sits him up in bed)
          Alex_Arm_L / R shoulder joints
          Alex_Head      neck joint
            Alex_Eyes_Open / Alex_Eyes_Closed   show one, hide the other
            Alex_Glasses

Built standing, facing -Y, about 1.5 m tall with a deliberately big head.
"""

import math

from lib import ball, box, cyl, group, mat, rod

# Head shape, shared by everything that has to sit on its surface
HEAD_R = 0.2
HEAD_SCALE = (1.06, 0.95, 0.98)
HEAD_Z = 0.17  # head centre above the neck pivot


def face(x, dz, out=0.0):
    """Point on the front of the head at sideways offset x and height dz from its centre."""
    rx, ry, rz = (HEAD_R * s for s in HEAD_SCALE)
    inside = max(0.0, 1 - (x / rx) ** 2 - (dz / rz) ** 2)
    return (x, -ry * math.sqrt(inside) - out, HEAD_Z + dz)


def set_visible(obj, visible):
    """Show or hide an object and everything parented under it."""
    for o in [obj, *obj.children_recursive]:
        o.hide_render = not visible
        o.hide_viewport = not visible


def build_glasses(parent, loc=(0, 0, 0), rot_z=0.0, name="Alex_Glasses",
                  eye_x=0.079, half_w=0.05, half_h=0.034, t=0.011, temple_end=(0.215, 0.2)):
    """
    Black rectangular frames. Origin is the bridge, level with the eyes.
    The defaults fit the toy puppet's oversized head; pass real measurements
    (see GLASSES_REAL in alex_human.py) for the realistic Alex.
    """
    g = group(name, loc, rot_z=rot_z, parent=parent)
    frame = mat("alex_glasses", "#101012", rough=0.35)
    bev = t * 0.2
    for side, tag in ((-1, "L"), (1, "R")):
        cx = side * eye_x
        box(f"Rim_Top_{tag}", (2 * half_w + t, t, t * 1.3), (cx, 0, half_h), frame, g, bevel=bev)
        box(f"Rim_Bottom_{tag}", (2 * half_w + t, t, t), (cx, 0, -half_h), frame, g, bevel=bev)
        box(f"Rim_In_{tag}", (t, t, 2 * half_h), (cx - side * half_w, 0, 0), frame, g, bevel=bev)
        box(f"Rim_Out_{tag}", (t, t, 2 * half_h), (cx + side * half_w, 0, 0), frame, g, bevel=bev)
        rod(f"Temple_{tag}", (side * (eye_x + half_w), 0, half_h * 0.6), (side * temple_end[0], temple_end[1], half_h * 0.45),
            t * 0.45, frame, g, segments=8)
    box("Bridge", (2 * (eye_x - half_w), t * 0.8, t), (0, 0, half_h * 0.35), frame, g, bevel=bev)
    return g


def build_alex(loc=(0, 0, 0), parent=None):
    """Build Alex standing at loc. Returns a dict of his pivots for posing."""
    skin = mat("alex_skin", "#e3ae88", rough=0.55, sss=0.25)
    skin_shade = mat("alex_skin_shade", "#d39874", rough=0.55, sss=0.25)
    hair = mat("alex_hair", "#17120f", rough=0.55)
    tee = mat("alex_tee", "#1b1b20", rough=0.9, kind="fabric")
    shorts = mat("alex_shorts", "#9c9b86", rough=0.9, kind="fabric")
    ink = mat("alex_ink", "#1a1210", rough=0.5)
    blush = mat("alex_blush", "#e8907e", rough=0.9)

    root = group("Alex", loc, parent=parent)
    hips = group("Alex_Hips", (0, 0, 0.62), parent=root)

    # Legs: shorts, bare shins and feet
    legs = {}
    for side, tag in ((-1, "L"), (1, "R")):
        leg = group(f"Alex_Leg_{tag}", (side * 0.095, 0, 0), parent=hips)
        cyl(f"Shorts_{tag}", 0.1, 0.25, (0, 0, -0.1), shorts, leg, radius_top=0.108, segments=24)
        cyl(f"Shin_{tag}", 0.062, 0.34, (0, 0, -0.38), skin, leg, radius_top=0.075, segments=20)
        ball(f"Foot_{tag}", 0.075, (0, -0.04, -0.57), skin, leg, scale=(0.9, 1.5, 0.6))
        legs[tag] = leg

    # Torso in a black tee, a bit stocky
    torso = group("Alex_Torso", (0, 0, 0), parent=hips)
    ball("Body", 0.215, (0, 0, 0.21), tee, torso, scale=(1.0, 0.8, 1.15), segments=32)
    cyl("Neck", 0.06, 0.1, (0, 0, 0.47), skin, torso, segments=20)

    arms = {}
    for side, tag in ((-1, "L"), (1, "R")):
        arm = group(f"Alex_Arm_{tag}", (side * 0.2, 0, 0.36), parent=torso)
        arm.rotation_euler = (0, -side * math.radians(12), 0)
        ball(f"Sleeve_{tag}", 0.07, (-side * 0.012, 0, -0.045), tee, arm, scale=(1.0, 1.0, 1.35))
        cyl(f"Arm_{tag}", 0.047, 0.3, (0, 0, -0.21), skin, arm, radius_top=0.056, segments=20)
        ball(f"Hand_{tag}", 0.06, (0, 0, -0.38), skin, arm)
        arms[tag] = arm

    # Head
    head = group("Alex_Head", (0, 0, 0.5), parent=torso)
    head.scale = (0.84, 0.84, 0.84)  # less of a cartoon big-head
    ball("Skull", HEAD_R, (0, 0, HEAD_Z), skin, head, scale=HEAD_SCALE, segments=40)
    for side, tag in ((-1, "L"), (1, "R")):
        ball(f"Ear_{tag}", 0.045, (side * 0.208, 0.015, HEAD_Z - 0.015), skin_shade, head, scale=(0.45, 0.9, 1.2))
        ball(f"Blush_{tag}", 0.034, face(side * 0.118, -0.06, -0.004), blush, head, scale=(1.0, 0.3, 0.75))
        box(f"Brow_{tag}", (0.062, 0.012, 0.016), face(side * 0.08, 0.06, 0.004), ink, head,
            rot=(0, side * math.radians(-7), 0), bevel=0.003)
    ball("Nose", 0.021, face(0, -0.03, 0.006), skin_shade, head, scale=(1.0, 0.8, 0.85))
    box("Mouth", (0.042, 0.008, 0.011), face(0, -0.088, 0.002), ink, head, bevel=0.003)

    eyes_open = group("Alex_Eyes_Open", parent=head)
    eyes_closed = group("Alex_Eyes_Closed", parent=head)
    for side, tag in ((-1, "L"), (1, "R")):
        cx = side * 0.079
        ball(f"Eye_{tag}", 0.023, face(cx, 0.0, 0.003), ink, eyes_open, scale=(1.0, 0.5, 1.3))
        # Closed eyes are little downward arcs
        steps = 5
        pts = []
        for i in range(steps + 1):
            a = math.pi * i / steps
            pts.append(face(cx + 0.03 * math.cos(a), -0.004 - 0.014 * math.sin(a), 0.004))
        for i in range(steps):
            rod(f"Lid_{tag}_{i}", pts[i], pts[i + 1], 0.0055, ink, eyes_closed, segments=8)

    # Hair: short at the sides, fuller and tousled on top with a fringe
    top = HEAD_Z
    ball("Hair_Cap", HEAD_R, (0, 0.022, top + 0.045), hair, head, scale=(1.09, 1.0, 0.86), segments=32)
    ball("Hair_Back", HEAD_R, (0, 0.07, top + 0.0), hair, head, scale=(1.0, 0.72, 0.92), segments=32)
    clumps = [
        # x, y, z above head centre, radius, tilt in degrees
        (-0.105, -0.06, 0.13, 0.07, 25), (-0.035, -0.085, 0.15, 0.075, -10), (0.045, -0.08, 0.15, 0.075, 15),
        (0.11, -0.05, 0.128, 0.07, -25), (-0.06, 0.03, 0.155, 0.08, 10), (0.06, 0.04, 0.152, 0.08, -15),
        (0.0, -0.01, 0.165, 0.075, 0),
    ]
    for i, (x, y, z, r, tilt) in enumerate(clumps):
        ball(f"Hair_Top_{i}", r, (x, y, top + z), hair, head, scale=(1.25, 1.3, 0.55),
             rot=(math.radians(tilt * 0.5), math.radians(tilt), 0), segments=16)
    fringe = [(-0.118, -0.13, 0.092, 22), (-0.05, -0.158, 0.1, 10), (0.03, -0.162, 0.094, -8), (0.1, -0.142, 0.1, -22)]
    for i, (x, y, z, tilt) in enumerate(fringe):
        ball(f"Hair_Fringe_{i}", 0.055, (x, y, top + z), hair, head, scale=(1.2, 0.75, 0.62),
             rot=(math.radians(-32), math.radians(tilt), 0), segments=16)

    glasses = build_glasses(head, loc=(0, face(0.079, 0, 0)[1] - 0.022, HEAD_Z + 0.002))

    return {
        "root": root, "hips": hips, "torso": torso, "head": head, "arms": arms, "legs": legs,
        "eyes_open": eyes_open, "eyes_closed": eyes_closed, "glasses": glasses,
    }


def pose_asleep(alex):
    alex["torso"].rotation_euler = (0, 0, 0)
    alex["head"].rotation_euler = (0, 0, math.radians(14))  # head lolled to one side
    set_visible(alex["eyes_open"], False)
    set_visible(alex["eyes_closed"], True)
    set_visible(alex["glasses"], False)


def pose_awake(alex):
    """Sat up in bed, glasses on, not pleased."""
    alex["torso"].rotation_euler = (math.radians(74), 0, 0)
    alex["head"].rotation_euler = (math.radians(-6), 0, math.radians(38))
    set_visible(alex["eyes_open"], True)
    set_visible(alex["eyes_closed"], False)
    set_visible(alex["glasses"], True)
