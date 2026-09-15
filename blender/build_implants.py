"""Implant variants on the healed ridge, all on a straight (vertical) axis through the missing tooth.

Titanium: two-piece grey threaded fixture + separate abutment with a visible connection line.
Zirconia: one-piece ivory body with integrated abutment.
Mini:     narrow 2.4 mm one-piece post with ball head carrying a snap-on denture segment.
"""
import importlib
import math
import sys

import bmesh
import bpy

sys.path.insert(0, "/Users/arif/dental-info-proj/blender")
import dental_lib as L

importlib.reload(L)
exec(open("/Users/arif/dental-info-proj/blender/build_jaw.py").read().split("jaw = L.collection")[0])  # height fns

O = bpy.data.objects
AX, AY = L.TOOTH_AXIS_XY
RIDGE_GUM_Z = gum_height(AX, AY, ridge=True)
BONE_CREST_Z = bone_height(AX, AY, ridge=True)
coll = L.collection("V2_Implants")

titanium = L.material("V2_Titanium", (0.55, 0.56, 0.58, 1), metal=1.0, rough=0.32)
titanium_join = L.material("V2_TitaniumJoin", (0.2, 0.2, 0.22, 1), metal=1.0, rough=0.5)
zirconia = L.material("V2_Zirconia", (0.8, 0.77, 0.7, 1), rough=0.3)
steel = L.material("V2_Steel", (0.7, 0.71, 0.73, 1), metal=1.0, rough=0.18)
oring = L.material("V2_ORing", (0.08, 0.08, 0.09, 1), rough=0.7)
crown_mat = L.material("V2_CrownCeramic", (0.78, 0.74, 0.66, 1), rough=0.25)
acrylic = L.material("V2_DentureAcrylic", (0.6, 0.2, 0.27, 1), rough=0.35)
denture_tooth = L.material("V2_DentureTooth", (0.76, 0.72, 0.64, 1), rough=0.3)


def threads(pitch, depth, start, end):
    def fn(t, th):
        if t < start or t > end:
            return 0.0
        ph = ((t / pitch) + th / (2 * math.pi)) % 1.0
        return depth * (1 - abs(2 * ph - 1)) - depth / 2
    return fn


def body_profile(t0, length, radius, tip_radius, step=0.05):
    prof, t = [], t0
    while t <= t0 + length + 1e-6:
        taper_start = t0 + length - 2.2
        r = radius if t < taper_start else radius - (t - taper_start) / 2.2 * (radius - tip_radius)
        prof.append((t, r))
        t += step
    return prof


def emergence_crown(name, cut_z, mat):
    """Natural crown shape above cut_z, narrowed near the bottom so it emerges from a ~2 mm abutment."""
    bm = L.world_bm(O["Object_2"])
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, cut_z * L.MM),
                           plane_no=(0, 0, 1), clear_inner=True)
    top_z = 1.9
    for v in bm.verts:
        z = v.co.z / L.MM
        if z < top_z:
            k = 0.5 + 0.5 * (z - cut_z) / (top_z - cut_z)
            v.co.x = (AX + (v.co.x / L.MM - AX) * k) * L.MM
            v.co.y = (AY + (v.co.y / L.MM - AY) * k) * L.MM
    bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
    o = L.object_from_bm(name, bm, mat, coll)
    L.remesh(o, 0.07, smooth=0, ratio=0.35)
    return o


# Adjacent teeth shared by every scene.
enamel = L.material("V2_Enamel", (0.7, 0.64, 0.53, 1), rough=0.35)
jaw = L.collection("V2_Jaw")
for name, src in (("ADJ_Left", "Object_2.002"), ("ADJ_Right", "Object_2.003")):
    o = L.copy_object(src, name, enamel, jaw)
    d = o.modifiers.new("Decimate", "DECIMATE")
    d.ratio = 0.3
    L.apply_modifiers(o)

# ---- Titanium two-piece
top = (AX, AY, BONE_CREST_Z)
L.object_from_bm("IMP_Ti_Fixture", L.place(L.lathe(body_profile(0.15, 8.0, 2.05, 1.35), 72,
                                                    threads(0.8, 0.3, 0.7, 7.4)), top), titanium, coll)
L.object_from_bm("IMP_Ti_Join", L.place(L.lathe([(0.0, 2.1), (0.15, 2.1)], 72), top), titanium_join, coll)
abut_top = (AX, AY, 3.0)
span = 3.0 - BONE_CREST_Z
L.object_from_bm("IMP_Ti_Abutment", L.place(L.lathe([(0.0, 1.35), (1.4, 1.6), (span - 1.6, 2.0), (span - 0.4, 1.9),
                                                     (span, 1.85)], 48), abut_top), titanium, coll)

# ---- Zirconia one-piece (abutment + body in one ivory part, shallower threads)
zr = [(0.0, 1.35), (1.4, 1.6), (span - 1.6, 2.0), (span - 0.2, 1.9)] + body_profile(span, 8.0, 2.0, 1.3)
L.object_from_bm("IMP_Zr_Body", L.place(L.lathe(zr, 72, threads(0.9, 0.22, span + 0.6, span + 7.4)), abut_top),
                 zirconia, coll)

emergence_crown("IMP_Crown", RIDGE_GUM_Z - 0.5, crown_mat)

# ---- Mini implant: ball head, polished collar, narrow threaded body
ball_r, ball_top = 1.1, RIDGE_GUM_Z + 2.9
mini = [(t, max(0.05, math.sqrt(max(0.0, ball_r ** 2 - (t - ball_r) ** 2)))) for t in
        [i * 0.1 for i in range(0, 23)]]
collar_t = ball_top - BONE_CREST_Z
mini += [(2.25, 0.75), (2.9, 0.75), (3.0, 1.2), (collar_t, 1.2)] + body_profile(collar_t + 0.05, 8.0, 1.2, 0.6)
L.object_from_bm("IMP_Mini_Post", L.place(L.lathe(mini, 48, threads(0.6, 0.2, collar_t + 0.4, collar_t + 7.6)),
                                          (AX, AY, ball_top)), steel, coll)
L.object_from_bm("IMP_Mini_Housing", L.place(L.lathe([(0.0, 1.75), (2.6, 1.75)], 48), (AX, AY, ball_top + 0.5)),
                 steel, coll)
ring = L.tube([(AX + 1.15 * math.cos(a), AY + 1.15 * math.sin(a), ball_top - ball_r)
               for a in (2 * math.pi * k / 32 for k in range(33))], [0.18] * 33, seg=10, cap=False)
L.object_from_bm("IMP_Mini_ORing", ring, oring, coll)

# Denture segment: acrylic saddle resting on the ridge between the neighbours, plus a denture tooth.
base = L.object_from_bm(
    "IMP_Denture_Base",
    L.heightfield_solid(lambda x, y: gum_height(x, y, True) + 2.9, -3.3, 7.6, -6.0, 5.4,
                        lambda x, y: gum_height(x, y, True) + 0.05, step=0.2),
    acrylic, coll)
L.remesh(base, 0.12, smooth=10, ratio=0.4)
bm = L.world_bm(O["Object_2"])
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 3.2 * L.MM),
                       plane_no=(0, 0, 1), clear_inner=True)
bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
dt = L.object_from_bm("IMP_Denture_Tooth", bm, denture_tooth, coll)
L.remesh(dt, 0.07, ratio=0.35)

for o in coll.objects:
    print(o.name, len(o.data.polygons), L.bbox_mm(o))
print("ridge gum z", round(RIDGE_GUM_Z, 2), "bone crest z", round(BONE_CREST_Z, 2))
